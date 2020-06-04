package resources

import (
	"context"
	"database/sql"
	"github.com/davecgh/go-spew/spew"
	"github.com/kapp-staging/kapp/api/client"
	"github.com/kapp-staging/kapp/api/config"
	_ "github.com/mattn/go-sqlite3"
	log "github.com/sirupsen/logrus"
	"gotest.tools/assert"
	"testing"
)

func TestStartMetricServer(t *testing.T) {
	runningConfig := &config.Config{}
	runningConfig.Install()
	clientManager := client.NewClientManager(runningConfig)
	err := StartMetricServer(context.Background(), clientManager)
	if err != nil {
		log.Fatal(err)
	}
}

func TestGetPodMetrics(t *testing.T) {
	metricDb, _ = sql.Open("sqlite3", "/tmp/metric_server.db")
	defer metricDb.Close()

	metrics := GetPodMetric("hello-world-7489bbccf5-vk685","kapp-hello-world")

	spew.Dump(metrics)
	assert.Equal(t, true, len(metrics.CPU) > 0)
}

func TestGetComponetMetrics(t *testing.T) {
	metricDb, _ = sql.Open("sqlite3", "/tmp/metric_server.db")
	defer metricDb.Close()

	metrics := GetComponentMetric( "hello-world", "kapp-hello-world")

	spew.Dump(metrics)
	assert.Equal(t, true, len(metrics.CPU) > 0)
}

func TestGetGetPodMetrics(t *testing.T) {
	metricDb, _ = sql.Open("sqlite3", "/tmp/metric_server.db")
	defer metricDb.Close()

	nodes := []string{"gke-kapp-staging-default-pool-582af7a5-d21k"}
	metrics := GetFilteredNodeMetrics(nodes)

	spew.Dump(metrics)
	assert.Equal(t, true, len(metrics.CPU) > 0)
}
