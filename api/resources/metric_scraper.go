package resources

import (
	"context"
	"database/sql"
	"fmt"
	"github.com/kapp-staging/kapp/api/client"
	_ "github.com/mattn/go-sqlite3"
	log "github.com/sirupsen/logrus"
	v12 "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/metrics/pkg/apis/metrics/v1beta1"
	mclientv1beta1 "k8s.io/metrics/pkg/client/clientset/versioned/typed/metrics/v1beta1"
	"strconv"
	"time"
)

var metricDb *sql.DB
var metricResolution = 5 * time.Second
var metricDuration = 15 * time.Minute

func StartMetricScraper(ctx context.Context, manager *client.ClientManager) error {
	metricClient, err := mclientv1beta1.NewForConfig(manager.ClusterConfig)
	if err != nil {
		log.Errorf("Init metric client error: %s", err)
		return err
	}
	restClient, err := kubernetes.NewForConfig(manager.ClusterConfig)
	if err != nil {
		log.Errorf("Init rest client error: %s", err)
		return err
	}

	metricDb, err = sql.Open("sqlite3", "/tmp/metric_scraper.db")
	if err != nil {
		log.Errorf("Unable to open Sqlite database: %s", err)
		return  err
	}
	defer metricDb.Close()

	// Populate tables
	err = CreateDatabase(metricDb)
	if err != nil {
		log.Errorf("Unable to initialize database tables: %s", err)
		return  err
	}

	log.Info("Metric scraper started")

	// Start the machine. Scrape every metricResolution
	ticker := time.NewTicker(metricResolution)

	for {
		select {
		case <-ctx.Done():
			ticker.Stop()
			return nil

		case <-ticker.C:
			err = update(metricClient, restClient, metricDb, &metricDuration)
			if err != nil {
				log.Errorf("Error updating metrics: %s", err)
			}
		}
	}
}

func update(client *mclientv1beta1.MetricsV1beta1Client, restClient *kubernetes.Clientset, db *sql.DB, metricDuration *time.Duration) error {
	podMetrics, err := client.PodMetricses("").List(v1.ListOptions{})
	if err != nil {
		log.Errorf("Error scraping pod metrics: %s", err)
		return err
	}

	podDetails, err := restClient.CoreV1().Pods("").List(v1.ListOptions{})
	if err != nil {
		log.Errorf("Error scraping pod details: %s", err)
		return err
	}
	completePodMetrics(podMetrics, podDetails)

	nodeMetrics, err := client.NodeMetricses().List(v1.ListOptions{})
	if err != nil {
		log.Errorf("Error scraping node metrics: %s", err)
		return err
	}

	// Insert scrapes into DB
	err = UpdateDatabase(db, nodeMetrics, podMetrics)
	if err != nil {
		log.Errorf("Error updating database: %s", err)
		return err
	}

	// Delete rows outside of the metricDuration time
	err = CullDatabase(db, metricDuration)
	if err != nil {
		log.Errorf("Error culling database: %s", err)
		return err
	}

	log.Debugf("Database updated: %d nodes, %d pods", len(nodeMetrics.Items), len(podMetrics.Items))
	return nil
}

func completePodMetrics(podMetrics *v1beta1.PodMetricsList, podDetails *v12.PodList) *v1beta1.PodMetricsList {
	podDetailsMap := make(map[string]*v12.Pod)
	for _, podDetailsItem := range podDetails.Items {
		podDetailsMap[podDetailsItem.Namespace+podDetailsItem.Name] = &podDetailsItem
	}

	for i := 0; i < len(podMetrics.Items); i++ {
		podDetail, ok := podDetailsMap[podMetrics.Items[i].Namespace+podMetrics.Items[i].Name]
		if ok {
			podMetrics.Items[i].Labels = podDetail.Labels
		}
	}

	return podMetrics
}

const PodMetricSql = "select time, sum(cpu) as cpu, sum(memory) as memory from pods where name = ? and namespace = ? group by time order by time asc;"
const ComponentMetricSql = "select time, sum(cpu) as cpu, sum(memory) as memory from pods where component = ? and namespace = ? group by time order by time asc;"
const ApplicationMetricSql = "select time, sum(cpu) as cpu, sum(memory) as memory from pods where namespace = ? group by time order by time asc;"
const NodeMetricSql = "select time, sum(cpu) as cpu, sum(memory) as memory from nodes where name = ? group by time order by time asc;"
const NodesMetricSql = "select time, sum(cpu) as cpu, sum(memory) as memory from nodes group by time order by time asc;"

func GetApplicationMetric(namespace string) MetricHistories {
	return getMetricHistories(ApplicationMetricSql, namespace)
}

func GetPodMetric(podName, namespace string) PodMetrics {
	podMetrics := PodMetrics{
		Name:            podName,
		MetricHistories: getMetricHistories(PodMetricSql, podName, namespace),
	}

	return podMetrics
}

func GetComponentMetric(componentName, namespace string) MetricHistories {
	return getMetricHistories(ComponentMetricSql, componentName, namespace)
}

func GetFilteredNodeMetrics(nodes []string) NodesMetricHistories {
	nodeMetricHistories := make(map[string]MetricHistories)
	nodesMetric := getMetricHistories(NodesMetricSql)
	for _, node := range nodes {
		nodeMetric := getMetricHistories(NodeMetricSql, node)
		nodeMetricHistories[node] = nodeMetric
	}
	return NodesMetricHistories{
		CPU:    nodesMetric.CPU,
		Memory: nodesMetric.Memory,
		Nodes:  nodeMetricHistories,
	}
}

func getMetricHistories(sql string, args ...interface{}) MetricHistories {
	metricHistories := MetricHistories{}
	if metricDb == nil {
		log.Errorf("Error metric DB nil")
		return metricHistories
	}

	rows, err := metricDb.Query(sql, args...)
	if err != nil {
		log.Errorf("Error getting metrics: %v", err)
		return metricHistories
	}

	defer rows.Close()

	for rows.Next() {
		var cpuValue string
		var memoryValue string
		var metricTime string
		err = rows.Scan(&metricTime, &cpuValue, &memoryValue)
		if err != nil {
			return metricHistories
		}

		layout := "2006-01-02T15:04:05Z"
		t, err := time.Parse(layout, metricTime)
		if err != nil {
			return metricHistories
		}

		cpuUint, err := strconv.ParseUint(cpuValue, 10, 64)
		memoryUnit, err := strconv.ParseUint(memoryValue, 10, 64)

		metricHistories.CPU = append(metricHistories.CPU, MetricPoint{
			Timestamp: t,
			Value:     cpuUint,
		})
		metricHistories.Memory = append(metricHistories.Memory, MetricPoint{
			Timestamp: t,
			Value:     memoryUnit,
		})
	}

	err = rows.Err()
	if err != nil {
		return metricHistories
	}

	return metricHistories
}


/*
	CreateDatabase creates tables for node and pod metrics
*/
func CreateDatabase(db *sql.DB) error {
	sqlStmt := `
	create table if not exists nodes (uid text, name text, cpu text, memory text, storage text, time datetime);
	create table if not exists pods (uid text, name text, namespace text, container text, component text, cpu text, memory text, storage text, time datetime);
	`
	_, err := db.Exec(sqlStmt)
	if err != nil {
		return err
	}

	return nil
}

/*
	UpdateDatabase updates nodeMetrics and podMetrics with scraped data
*/
func UpdateDatabase(db *sql.DB, nodeMetrics *v1beta1.NodeMetricsList, podMetrics *v1beta1.PodMetricsList) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare("insert into nodes(uid, name, cpu, memory, storage, time) values(?, ?, ?, ?, ?, datetime('now'))")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, v := range nodeMetrics.Items {
		_, err = stmt.Exec(v.UID, v.Name, v.Usage.Cpu().Value(), v.Usage.Memory().Value(), v.Usage.StorageEphemeral().MilliValue()/1000)
		if err != nil {
			return err
		}
	}

	stmt, err = tx.Prepare("insert into pods(uid, name, namespace, container, component, cpu, memory, storage, time) values(?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, v := range podMetrics.Items {
		component := ""
		_, ok := v.ObjectMeta.Labels["kapp-component"]
		if ok {
			component = v.ObjectMeta.Labels["kapp-component"]
		}
		for _, u := range v.Containers {
			_, err = stmt.Exec(v.UID, v.Name, v.Namespace, u.Name, component, u.Usage.Cpu().Value(), u.Usage.Memory().Value(), u.Usage.StorageEphemeral().MilliValue()/1000)
			if err != nil {
				return err
			}
		}
	}

	err = tx.Commit()

	if err != nil {
		rberr := tx.Rollback()
		if rberr != nil {
			return rberr
		}
		return err
	}

	return nil
}

/*
	CullDatabase deletes rows from nodes and pods based on a time window.
*/
func CullDatabase(db *sql.DB, window *time.Duration) error {
	tx, err := db.Begin()

	windowStr := fmt.Sprintf("-%.0f seconds", window.Seconds())

	nodestmt, err := tx.Prepare("delete from nodes where time <= datetime('now', ?);")
	if err != nil {
		return err
	}

	defer nodestmt.Close()
	res, err := nodestmt.Exec(windowStr)
	if err != nil {
		return err
	}

	affected, _ := res.RowsAffected()
	log.Debugf("Cleaning up nodes: %d rows removed", affected)

	podstmt, err := tx.Prepare("delete from pods where time <= datetime('now', ?);")

	defer podstmt.Close()
	res, err = podstmt.Exec(windowStr)
	if err != nil {
		return err
	}

	affected, _ = res.RowsAffected()
	log.Debugf("Cleaning up pods: %d rows removed", affected)
	err = tx.Commit()

	if err != nil {
		rberr := tx.Rollback()
		if rberr != nil {
			return rberr
		}
		return err
	}

	return nil
}


type NodesMetricHistories struct {
	CPU    MetricHistory              `json:"cpu"`
	Memory MetricHistory              `json:"memory"`
	Nodes  map[string]MetricHistories `json:"nodes"`
}
