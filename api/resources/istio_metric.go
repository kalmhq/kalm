package resources

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	coreV1 "k8s.io/api/core/v1"
	"net/http"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strconv"
)

type IstioMetricListChannel struct {
	List  chan map[string]IstioMetric
	Error chan error
}

// https://istio.io/latest/docs/reference/config/metrics/
type IstioMetric struct {
	HTTP *HTTPMetric `json:"http,omitempty"`
	TCP  *TCPMetric  `json:"tcp,omitempty"`
}

func mergeIstioMetric(a, b IstioMetric) (rst IstioMetric) {

	httpReqTotal := 0
	var aMap, bMap map[string]int
	if a.HTTP != nil {
		httpReqTotal += a.HTTP.RequestsTotal
		aMap = a.HTTP.RespCodeCountMap
	}
	if b.HTTP != nil {
		httpReqTotal += b.HTTP.RequestsTotal
		bMap = b.HTTP.RespCodeCountMap
	}

	if a.HTTP != nil || b.HTTP != nil {
		rst.HTTP = &HTTPMetric{
			RequestsTotal:    httpReqTotal,
			RespCodeCountMap: mergeMap(aMap, bMap),
		}
	}

	//todo tcp

	return rst
}

func mergeMap(a, b map[string]int) map[string]int {
	rst := make(map[string]int)

	for k, v := range a {
		rst[k] += v
	}
	for k, v := range b {
		rst[k] += v
	}

	return rst
}

// original data:
//
// istio_requests_total{
//   destination_service="kapp-dashboard.kapp-system.svc.cluster.local"
//   destination_service_name="kapp-dashboard.kapp-system.svc.cluster.local"
//   ...
//   response_code="0"
//   ...
// }
//
// istio_requests_total{destination_service="kapp-dashboard.kapp-system.svc.cluster.local", response_code="200"}
type HTTPMetric struct {
	RequestsTotal    int
	RespCodeCountMap map[string]int
}

// istio_tcp_sent_bytes_total{destination_service="zk-headless.kapp-zk.svc.cluster.local", instance="10.24.1.120:15090"}
type TCPMetric struct {
	SentBytesTotal     int
	ReceivedBytesTotal int
}

func (builder *Builder) GetIstioMetricsListChannel(ns string) *IstioMetricListChannel {
	channel := IstioMetricListChannel{
		List:  make(chan map[string]IstioMetric, 1),
		Error: make(chan error, 1),
	}

	go func() {
		fmt.Println(1)

		//hardCodedIstioPrometheusAPIAdx := "http://prometheus.istio-system:9090"
		hardCodedIstioPrometheusAPIAdx := "localhost:9090"

		fmt.Println(1)
		svcName := fmt.Sprintf(`.*.%s.svc.cluster.local`, ns)
		query := fmt.Sprintf(`istio_requests_total{destination_service=~"%s"}`, svcName)

		api := fmt.Sprintf("http://%s/api/v1/query?query=%s", hardCodedIstioPrometheusAPIAdx, query)
		resp, err := http.Get(api)
		if err != nil {
			channel.Error <- err
			return
		}

		var promResp PromResponse
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			channel.Error <- err
			return
		}

		err = json.Unmarshal(body, &promResp)
		if err != nil {
			fmt.Printf("fail to parse resp from prometheus, val: %s, err: %s\n", body, err)
			channel.Error <- err
			return
		}

		// aggregate rsts by svc
		svc2MetricMap := make(map[string]IstioMetric)
		for _, rst := range promResp.Data.Result {
			valInStr, ok := rst.Value[1].(string)
			if !ok {
				continue
			}

			val, err := strconv.Atoi(valInStr)
			if err != nil {
				continue
			}

			svc, exist1 := rst.Metric["destination_service"]
			respCode, exist2 := rst.Metric["response_code"]
			if !exist1 || !exist2 {
				continue
			}

			if _, exist := svc2MetricMap[svc]; !exist {
				svc2MetricMap[svc] = IstioMetric{
					HTTP: &HTTPMetric{
						RequestsTotal:    0,
						RespCodeCountMap: map[string]int{},
					},
				}
			}

			httpMetric := svc2MetricMap[svc].HTTP
			httpMetric.RequestsTotal += val
			httpMetric.RespCodeCountMap[respCode] += val
		}

		channel.List <- svc2MetricMap
		channel.Error <- err
	}()

	return &channel
}

type PromResponse struct {
	Status string `json:"status"`
	Data   struct {
		ResultType string       `json:"resultType"`
		Result     []PromResult `json:"result"`
	} `json:"data"`
}

type PromResult struct {
	//Metric struct {
	//	DestService  string `json:"destination_service"`
	//	ResponseCode string `json:"response_code"`
	//} `json:"metric"`
	Metric map[string]string `json:"metric"`
	Value  []interface{}     `json:"value,string"`
}

type PodListChannel struct {
	List  chan *coreV1.PodList
	Error chan error
}

func (builder *Builder) GetPodListChannel(opts ...client.ListOption) *PodListChannel {
	channel := &PodListChannel{
		List:  make(chan *coreV1.PodList, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var list coreV1.PodList
		err := builder.List(&list, opts...)
		channel.List <- &list
		channel.Error <- err
	}()

	return channel
}
