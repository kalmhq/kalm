package resources

import (
	"container/heap"
	"context"
	"fmt"
	"github.com/influxdata/influxdb/pkg/slices"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	//metricv1alpha1 "k8s.io/metrics/pkg/apis/metrics/v1alpha1"
	metricv1beta1 "k8s.io/metrics/pkg/apis/metrics/v1beta1"
	mclientv1beta1 "k8s.io/metrics/pkg/client/clientset/versioned/typed/metrics/v1beta1"
	"time"
)

//type PodMetricsListChannel struct {
//	List  chan *metricv1beta1.PodMetricsList
//	Error chan error
//}

//func (builder *Builder) GetPodMetricsListChannel(namespaces string, listOptions metav1.ListOptions) *PodMetricsListChannel {
//	channel := &PodMetricsListChannel{
//		List:  make(chan *metricv1beta1.PodMetricsList, 1),
//		Error: make(chan error, 1),
//	}
//
//	client, err := mclientv1beta1.NewForConfig(builder.ConfigSchema)
//	if err != nil {
//		channel.List <- nil
//		channel.Error <- err
//
//		return channel
//	}
//
//	go func() {
//		list, err := client.PodMetricses(namespaces).List(listOptions)
//
//		channel.List <- list
//		channel.Error <- err
//	}()
//
//	return channel
//}

// componentA -> {pod1 -> metric, metric, ...}
//               {pod2 -> metric, metric, ...}
var componentMetricDB = make(map[string]map[string][]metricv1beta1.PodMetrics)
var podMetricDB = make(map[string][]metricv1beta1.PodMetrics)

// nodeName1 -> {metricT1, metricT2, ...}
// nodeName2 -> {metricT1, ...}
var nodeMetricDB = make(map[string][]metricv1beta1.NodeMetrics)

// todo lock

var metricResolution = 5 * time.Second

//var metricResolution = 30 * time.Second
var metricDuration = 15 * time.Minute

func StartMetricsScraper(ctx context.Context, config *rest.Config) error {
	fmt.Println("metrics scraper running")

	k8sClient, err := kubernetes.NewForConfig(config)
	if err != nil {
		return err
	}

	metricClient, err := mclientv1beta1.NewForConfig(config)
	if err != nil {
		return err
	}

	ticker := time.NewTicker(metricResolution)
	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
			case <-ticker.C:
				// get all kapp-applications
				var appList v1.NamespaceList
				err = k8sClient.RESTClient().Get().AbsPath("/api/v1/applications").Do().Into(&appList)
				if err != nil {
					fmt.Errorf("fail get applications, err: %s", err)
				}

				//fmt.Println("apps found:", len(appList.Items))

				// get metrics under apps' ns
				ns2MetricsListMap := make(map[string]*metricv1beta1.PodMetricsList)
				for _, app := range appList.Items {
					if _, exist := ns2MetricsListMap[app.Name]; exist {
						continue
					}

					metricsList, err := metricClient.PodMetricses(app.Name).List(metav1.ListOptions{})
					if err != nil {
						fmt.Printf("fail to list podMetrics for ns: %s, err: %s\n", app.Name, err)
					}

					for _, podMetric := range metricsList.Items {
						if podMetricDB[podMetric.Name] == nil {
							podMetricDB[podMetric.Name] = make([]metricv1beta1.PodMetrics, 0)
						}

						podMetricSlice := podMetricDB[podMetric.Name]

						//podMetricDB[podMetric.Name] = append(
						//	podMetricDB[podMetric.Name],
						//	podMetric,
						//)

						if len(podMetricSlice) > 0 &&
							podMetricSlice[len(podMetricSlice)-1].Timestamp.Unix() == podMetric.Timestamp.Unix() {
							podMetricSlice[len(podMetricSlice)-1] = podMetric
							continue
						}

						podMetricSlice = append(podMetricSlice, podMetric)

						podMetricDB[podMetric.Name] = podMetricSlice
					}

					// purge old metrics
					for podName, metricsSlice := range podMetricDB {
						for len(metricsSlice) > 0 {
							cutTs := time.Now().Add(-1 * metricDuration)
							if metricsSlice[0].Timestamp.Time.After(cutTs) {
								break
							}

							metricsSlice = metricsSlice[1:]
						}

						if len(metricsSlice) == 0 {
							delete(podMetricDB, podName)
						} else {
							podMetricDB[podName] = metricsSlice
						}
					}

					ns2MetricsListMap[app.Name] = metricsList
					//fmt.Printf("metrics found under ns(%s): %d\n", app.Name, len(metricsList.Items))
				}

				for _, app := range appList.Items {
					metricsList, exist := ns2MetricsListMap[app.Name]

					if !exist {
						continue
					}

					var componentList v1alpha1.ComponentList
					err = k8sClient.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/" + app.Name + "/components").Do().Into(&componentList)

					if err != nil {
						fmt.Errorf("fail get components, err: %s", err)
						continue
					}

					cacheMetricsForAppIntoLocalDB(componentList, metricsList)
				}

				// nodes metrics
				nodeMetricsList, err := metricClient.NodeMetricses().List(metav1.ListOptions{})
				if err != nil {
					fmt.Errorf("fail get nodes, err: %s", err)
				}

				//nodeMetricsCnt := 0
				//if nodeMetricsList != nil {
				//	nodeMetricsCnt = len(nodeMetricsList.Items)
				//}
				//fmt.Printf("node metrics found %d\n", nodeMetricsCnt)

				cacheMetricsForNodesIntoLocalDB(nodeMetricsList)
			}
		}
	}()

	return nil
}

func cacheMetricsForNodesIntoLocalDB(nodeMetricsList *metricv1beta1.NodeMetricsList) {
	if nodeMetricsList == nil {
		return
	}

	for _, nodeMetrics := range nodeMetricsList.Items {
		nodeName := nodeMetrics.Name

		v := nodeMetricDB[nodeName]

		nodeMetrics = alignMetricsByMinute(nodeMetrics)
		if len(v) > 0 && v[len(v)-1].Timestamp.Unix() == nodeMetrics.Timestamp.Unix() {
			// ignore duplicate
			continue
		}

		v = append(v, nodeMetrics)

		nodeMetricDB[nodeName] = v
	}
}

func alignMetricsByMinute(metrics metricv1beta1.NodeMetrics) metricv1beta1.NodeMetrics {
	alignTsByMinute := metrics.Timestamp.Time.Unix() / 60 * 60

	metrics.Timestamp = metav1.NewTime(time.Unix(alignTsByMinute, 0))

	return metrics
}

func cacheMetricsForAppIntoLocalDB(componentList v1alpha1.ComponentList, metricsList *metricv1beta1.PodMetricsList) {

	for _, component := range componentList.Items {
		componentKey := fmt.Sprintf("%s-%s", component.Namespace, component.Name)

		if _, exist := componentMetricDB[componentKey]; !exist {
			// init map: pod -> metrics time serials
			componentMetricDB[componentKey] = make(map[string][]metricv1beta1.PodMetrics)
		}

		for _, podMetrics := range metricsList.Items {

			if podMetrics.Namespace != component.Namespace {
				// ignore if is not pod of this app
				continue
			}

			// real dirty impl details here, should replace this if exists any better way
			var hit bool
			for _, c := range podMetrics.Containers {
				if c.Name != component.Name {
					continue
				}

				hit = true
				break
			}

			if !hit {
				continue
			}

			vPodMetricsSlice := componentMetricDB[componentKey][podMetrics.Name]

			// ignore if ts is same
			if len(vPodMetricsSlice) > 0 &&
				vPodMetricsSlice[len(vPodMetricsSlice)-1].Timestamp.Unix() == podMetrics.Timestamp.Unix() {
				continue
			}

			vPodMetricsSlice = append(vPodMetricsSlice, podMetrics)

			// purge old metrics
			for len(vPodMetricsSlice) > 0 {
				cutTs := time.Now().Add(-1 * metricDuration)
				if vPodMetricsSlice[0].Timestamp.Time.After(cutTs) {
					break
				}

				vPodMetricsSlice = vPodMetricsSlice[1:]
			}

			componentMetricDB[componentKey][podMetrics.Name] = vPodMetricsSlice

			//fmt.Println(fmt.Sprintf("%s -> %s", componentKey, podMetrics.Name), vPodMetricsSlice, len(vPodMetricsSlice))
		}
	}
}

type NodesMetricHistories struct {
	CPU    MetricHistory              `json:"cpu"`
	Memory MetricHistory              `json:"memory"`
	Nodes  map[string]MetricHistories `json:"nodes"`
}

func GetFilteredNodeMetrics(nodes []string) NodesMetricHistories {
	nodeMetricHistories := make(map[string]MetricHistories)

	var cpuHistoryList []MetricHistory
	var memHistoryList []MetricHistory
	for nodeName, nodeMetricsList := range nodeMetricDB {
		if !slices.Exists(nodes, nodeName) {
			continue
		}

		oneNode := getNodeMetricHistories(nodeName, nodeMetricsList)
		nodeMetricHistories[nodeName] = oneNode

		cpuHistoryList = append(cpuHistoryList, oneNode.CPU)
		memHistoryList = append(memHistoryList, oneNode.Memory)
	}

	aggCpu := aggregateHistoryList(cpuHistoryList)
	aggMem := aggregateHistoryList(memHistoryList)

	return NodesMetricHistories{
		CPU:    aggCpu,
		Memory: aggMem,
		Nodes:  nodeMetricHistories,
	}
}

func getNodeMetricHistories(name string, list []metricv1beta1.NodeMetrics) MetricHistories {
	var memHistory MetricHistory
	var cpuHistory MetricHistory

	for _, nodeMetric := range list {
		memHistory = append(memHistory, MetricPoint{
			Timestamp: nodeMetric.Timestamp.Time,
			Value:     uint64(nodeMetric.Usage.Memory().Value()),
		})

		cpuHistory = append(cpuHistory, MetricPoint{
			Timestamp: nodeMetric.Timestamp.Time,
			Value:     uint64(nodeMetric.Usage.Cpu().Value()),
		})
	}

	return MetricHistories{
		Memory: memHistory,
		CPU:    cpuHistory,
	}

}

// componentName -> componentMetricsSum
func getPodMetrics(podName string) PodMetrics {
	rst := PodMetrics{
		Name: podName,
	}

	metricsSlice := podMetricDB[podName]

	if metricsSlice == nil {
		return rst
	}

	rst.MetricHistories = MetricHistories{
		CPU:    make(MetricHistory, len(metricsSlice)),
		Memory: make(MetricHistory, len(metricsSlice)),
	}

	for i, podMetrics := range metricsSlice {
		sumCPU := resource.NewQuantity(0, "")
		sumMemory := resource.NewQuantity(0, "")

		for _, container := range podMetrics.Containers {
			sumCPU.Add(container.Usage[v1.ResourceCPU])
			sumMemory.Add(container.Usage[v1.ResourceMemory])
		}

		rst.MetricHistories.CPU[i] = MetricPoint{
			Timestamp: podMetrics.Timestamp.Time,
			Value:     uint64(sumCPU.Value()),
		}
		rst.MetricHistories.Memory[i] = MetricPoint{
			Timestamp: podMetrics.Timestamp.Time,
			Value:     uint64(sumMemory.Value()),
		}
	}

	return rst
}

// componentName -> componentMetricsSum
func getComponentKey2MetricMap() map[string]ComponentMetrics {
	rst := make(map[string]ComponentMetrics)

	for compName, podMap := range componentMetricDB {
		compMetrics := ComponentMetrics{
			Name: compName,
			Pods: make(map[string]MetricHistories),
		}

		for podName, metricsHistory := range podMap {
			compMetrics.Pods[podName] = toMetricSum(metricsHistory)
		}

		podsMetricsSum := aggregatePodsSum(compMetrics.Pods)
		compMetrics.Memory = podsMetricsSum.Memory
		compMetrics.CPU = podsMetricsSum.CPU

		rst[compName] = compMetrics
	}

	return rst
}

type MetricHistory []MetricPoint

func aggregateHistoryList(historyList []MetricHistory) (history MetricHistory) {
	pq := make(PriorityQueue, len(historyList))

	for i, history := range historyList {
		pq[i] = &Item{
			value: history,
			n:     0,
			index: i,
		}
	}
	heap.Init(&pq)

	for pq.Len() > 0 {
		item := heap.Pop(&pq).(*Item)
		//fmt.Printf("%.2d:%s ", item.priority(), item.value)

		if item.n >= len(item.value) {
			continue
		}

		target := item.value[item.n]

		if len(history) == 0 {
			history = append(history, MetricPoint{
				Timestamp: target.Timestamp,
				Value:     target.Value,
			})
		} else {
			latestPoint := &history[len(history)-1]
			if latestPoint.Timestamp.Unix() == target.Timestamp.Unix() {
				// merge
				latestPoint.Value += target.Value
			} else {
				// append
				history = append(history, MetricPoint{
					Timestamp: target.Timestamp,
					Value:     target.Value,
				})
			}
		}

		// add back if
		if item.n+1 < len(item.value) {
			item.n += 1
			heap.Push(&pq, item)
		}
	}

	return
}

func aggregateMapOfPod2Metrics(pods map[string]MetricHistories, mType string) MetricHistory {
	var historyList []MetricHistory
	for _, pod := range pods {
		if mType == "cpu" {
			historyList = append(historyList, pod.CPU)
		} else {
			historyList = append(historyList, pod.Memory)
		}
	}

	return aggregateHistoryList(historyList)
}
func aggregatePodsSum(pods map[string]MetricHistories) MetricHistories {
	cpuPoints := aggregateMapOfPod2Metrics(pods, "cpu")
	memoryPoints := aggregateMapOfPod2Metrics(pods, "memory")

	return MetricHistories{
		CPU:    cpuPoints,
		Memory: memoryPoints,
	}
}

// https://golang.org/pkg/container/heap/
type Item struct {
	value []MetricPoint
	// tracks which point we are using
	n int
	//priority int // The priority of the item in the queue.

	// The index is needed by update and is maintained by the heap.Interface methods.
	index int // The index of the item in the heap.
}

func (i Item) priority() int {
	if i.n >= len(i.value) {
		return int(time.Now().Unix())
	}

	return int(i.value[i.n].Timestamp.Unix())
}

type PriorityQueue []*Item

func (pq PriorityQueue) Len() int {
	return len(pq)
}

func (pq PriorityQueue) Less(i, j int) bool {
	return pq[i].priority() < pq[j].priority()
}

func (pq PriorityQueue) Swap(i, j int) {
	pq[i], pq[j] = pq[j], pq[i]
	pq[i].index = i
	pq[j].index = j
}

func (pq *PriorityQueue) Push(x interface{}) {
	n := len(*pq)
	item := x.(*Item)
	item.index = n
	*pq = append(*pq, item)
}

func (pq *PriorityQueue) Pop() interface{} {
	old := *pq
	n := len(old)
	item := old[n-1]
	old[n-1] = nil  // avoid memory leak
	item.index = -1 // for safety
	*pq = old[0 : n-1]
	return item
}

// update modifies the priority and value of an Item in the queue.
//func (pq *PriorityQueue) update(item *Item, value string, priority int) {
//	item.value = value
//	item.priority = priority
//	heap.Fix(pq, item.index)
//}

func toMetricSum(history []metricv1beta1.PodMetrics) MetricHistories {
	sum := MetricHistories{}

	for _, podMetrics := range history {
		var memSum uint64
		var cpuSum uint64

		for _, container := range podMetrics.Containers {
			mem := container.Usage.Memory()
			cpu := container.Usage.Cpu()

			memSum += uint64(mem.Value())
			cpuSum += uint64(cpu.Value())
		}

		sum.Memory = append(sum.Memory, MetricPoint{
			Timestamp: podMetrics.Timestamp.Time,
			Value:     memSum,
		})
		sum.CPU = append(sum.CPU, MetricPoint{
			Timestamp: podMetrics.Timestamp.Time,
			Value:     cpuSum,
		})
	}

	return sum
}
