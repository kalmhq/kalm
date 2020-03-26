package resources

import (
	"container/heap"
	"context"
	"fmt"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	//metricv1alpha1 "k8s.io/metrics/pkg/apis/metrics/v1alpha1"
	metricv1beta1 "k8s.io/metrics/pkg/apis/metrics/v1beta1"
	mclientv1beta1 "k8s.io/metrics/pkg/client/clientset/versioned/typed/metrics/v1beta1"
	"strings"
	"time"
)

type PodMetricsListChannel struct {
	List  chan *metricv1beta1.PodMetricsList
	Error chan error
}

func (builder *Builder) GetPodMetricsListChannel(namespaces string, listOptions metav1.ListOptions) *PodMetricsListChannel {
	channel := &PodMetricsListChannel{
		List:  make(chan *metricv1beta1.PodMetricsList, 1),
		Error: make(chan error, 1),
	}

	client, err := mclientv1beta1.NewForConfig(builder.Config)
	if err != nil {
		channel.List <- nil
		channel.Error <- err

		return channel
	}

	go func() {
		list, err := client.PodMetricses(namespaces).List(listOptions)

		channel.List <- list
		channel.Error <- err
	}()

	return channel
}

// componentA -> {pod1 -> metric, metric, ...}
//               {pod2 -> metric, metric, ...}
var componentMetricDB = make(map[string]map[string][]metricv1beta1.PodMetrics)

// todo lock

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

	metricResolution := 5 * time.Second
	//metricResolution := 1 * time.Minute
	//metricDuration := 15 * time.Minute

	ticker := time.NewTicker(metricResolution)

	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
			case <-ticker.C:
				// get all kapp-applications
				var appList v1alpha1.ApplicationList
				err := k8sClient.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/applications").Do().Into(&appList)
				if err != nil {
					fmt.Errorf("fail get applications, err: %s", err)
				}

				// fetch & fill new metrics
				metricsList, err := metricClient.PodMetricses("").List(metav1.ListOptions{})
				if err != nil {
					fmt.Print("fail to list podMetrics, err:", err)
				}

				for _, app := range appList.Items {
					for _, component := range app.Spec.Components {
						componentKey := fmt.Sprintf("%s-%s", app.Namespace, component.Name)

						if _, exist := componentMetricDB[componentKey]; !exist {
							componentMetricDB[componentKey] = make(map[string][]metricv1beta1.PodMetrics)
						}

						for _, podMetrics := range metricsList.Items {

							if podMetrics.Namespace != app.Namespace ||
								!strings.HasPrefix(podMetrics.Name, fmt.Sprintf("%s-%s", app.Name, component.Name)) {
								continue
							}

							vPodMetricsSlice := componentMetricDB[componentKey][podMetrics.Name]
							// ignore if ts is same
							if len(vPodMetricsSlice) > 0 &&
								vPodMetricsSlice[len(vPodMetricsSlice)-1].Timestamp.Unix() == podMetrics.Timestamp.Unix() {
								continue
							}

							vPodMetricsSlice = append(vPodMetricsSlice, podMetrics)
							componentMetricDB[componentKey][podMetrics.Name] = vPodMetricsSlice

							fmt.Println(fmt.Sprintf("%s -> %s", componentKey, podMetrics.Name), vPodMetricsSlice, len(vPodMetricsSlice))
						}
					}
				}

				// todo rm not showing pod list (deleted)
				// todo clean if metrics older than 15min
			}
		}
	}()

	return nil
}

// componentName -> componentMetricsSum
func getComponentMetricSumList() map[string]ComponentMetricsSum {
	rst := make(map[string]ComponentMetricsSum)

	for compName, podMap := range componentMetricDB {
		compMetricSum := ComponentMetricsSum{
			Name: compName,
			Pods: make(map[string]MetricsSum),
		}

		for podName, metricsHistory := range podMap {
			compMetricSum.Pods[podName] = toMetricSum(metricsHistory)
		}

		podsMetricsSum := aggregatePodsSum(compMetricSum.Pods)
		compMetricSum.MemoryUsageHistory = podsMetricsSum.MemoryUsageHistory
		compMetricSum.CPUUsageHistory = podsMetricsSum.CPUUsageHistory

		rst[compName] = compMetricSum
	}

	return rst
}

func aggregateMetrics(pods map[string]MetricsSum, mType string) []MetricPoint {
	var points []MetricPoint

	pq := make(PriorityQueue, len(pods))

	i := 0
	for _, pod := range pods {
		if mType == "cpu" {
			pq[i] = &Item{
				value: pod.CPUUsageHistory,
				n:     0,
				index: i,
			}
		} else {
			pq[i] = &Item{
				value: pod.MemoryUsageHistory,
				n:     0,
				index: i,
			}
		}

		i++
	}
	heap.Init(&pq)

	for pq.Len() > 0 {
		item := heap.Pop(&pq).(*Item)
		//fmt.Printf("%.2d:%s ", item.priority(), item.value)

		if item.n >= len(item.value) {
			continue
		}

		target := item.value[item.n]

		if len(points) == 0 {
			points = append(points, MetricPoint{
				Timestamp: target.Timestamp,
				Value:     target.Value,
			})
		} else {
			latestPoint := &points[len(points)-1]
			if latestPoint.Timestamp.Unix() == target.Timestamp.Unix() {
				// merge
				latestPoint.Value += target.Value
			} else {
				// append
				points = append(points, MetricPoint{
					Timestamp: target.Timestamp,
					Value:     target.Value,
				})
			}
		}

		// add back if
		if item.n+1 < len(item.value) {
			item.n += 1
			pq.Push(item)
		}
	}

	return points
}
func aggregatePodsSum(pods map[string]MetricsSum) MetricsSum {
	cpuPoints := aggregateMetrics(pods, "cpu")
	memoryPoints := aggregateMetrics(pods, "memory")

	return MetricsSum{
		CPUUsageHistory:    cpuPoints,
		MemoryUsageHistory: memoryPoints,
	}
}

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

func toMetricSum(history []metricv1beta1.PodMetrics) MetricsSum {
	sum := MetricsSum{}

	for _, podMetrics := range history {
		var memSum uint64
		var cpuSum uint64

		for _, container := range podMetrics.Containers {
			mem := container.Usage.Memory()
			cpu := container.Usage.Cpu()

			memSum += uint64(mem.Value())
			cpuSum += uint64(cpu.Value())
		}

		sum.MemoryUsageHistory = append(sum.MemoryUsageHistory, MetricPoint{
			Timestamp: podMetrics.Timestamp.Time,
			Value:     memSum,
		})
		sum.CPUUsageHistory = append(sum.CPUUsageHistory, MetricPoint{
			Timestamp: podMetrics.Timestamp.Time,
			Value:     cpuSum,
		})
	}

	return sum
}
