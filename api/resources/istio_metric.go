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

	//tcp
	rec := 0
	sent := 0
	if a.TCP != nil {
		rec += a.TCP.ReceivedBytesTotal
		sent += a.TCP.SentBytesTotal
	}
	if b.TCP != nil {
		rec += b.TCP.ReceivedBytesTotal
		sent += b.TCP.SentBytesTotal
	}

	if a.TCP != nil || b.TCP != nil {
		rst.TCP = &TCPMetric{
			ReceivedBytesTotal: rec,
			SentBytesTotal:     sent,
		}
	}

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

func mergeIstioMetricMap(a, b map[string]IstioMetric) map[string]IstioMetric {
	fmt.Println("merge map:", a, b)
	rst := make(map[string]IstioMetric)

	for svc, v := range a {
		// clone metric in a
		rst[svc] = mergeIstioMetric(IstioMetric{}, v)
	}

	for svc, v := range b {
		rst[svc] = mergeIstioMetric(rst[svc], v)
	}

	fmt.Println("merge map rst:", rst)
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
	RequestsTotal    int            `json:"requestsTotal"`
	RespCodeCountMap map[string]int `json:"respCodeCountMap"`
}

// istio_tcp_sent_bytes_total{destination_service="zk-headless.kapp-zk.svc.cluster.local", instance="10.24.1.120:15090"}
type TCPMetric struct {
	SentBytesTotal     int `json:"sentBytesTotal"`
	ReceivedBytesTotal int `json:"receivedBytesTotal"`
}

func (builder *Builder) GetIstioMetricsListChannel(ns string) *IstioMetricListChannel {
	channel := IstioMetricListChannel{
		List:  make(chan map[string]IstioMetric, 1),
		Error: make(chan error, 1),
	}

	go func() {
		httpSvc2MetricMap, err1 := getIstioHTTPMetricMap(ns)
		tcpSvc2MetricMap, err2 := getIstioTCPMetricMap(ns)

		channel.List <- mergeIstioMetricMap(httpSvc2MetricMap, tcpSvc2MetricMap)
		channel.Error <- concatErr(err1, err2)
	}()

	return &channel
}

func concatErr(errSlice ...error) error {
	var rstErr error
	for _, err := range errSlice {
		if err == nil {
			continue
		}

		rstErr = fmt.Errorf("%s; %s", rstErr, err)
	}

	return rstErr
}

//var hardCodedIstioPrometheusAPIHost = "localhost:9090"
var hardCodedIstioPrometheusAPIHost = "prometheus.istio-system:9090"

func getIstioHTTPMetricMap(ns string) (map[string]IstioMetric, error) {
	svcName := fmt.Sprintf(`.*.%s.svc.cluster.local`, ns)
	query := fmt.Sprintf(`istio_requests_total{destination_service=~"%s"}`, svcName)

	api := fmt.Sprintf("http://%s/api/v1/query?query=%s", hardCodedIstioPrometheusAPIHost, query)

	promResp, err := queryPrometheusAPI(api)
	if err != nil {
		return nil, err
	}

	// aggregate rsts by svc
	svc2MetricMap := make(map[string]IstioMetric)
	for _, rst := range promResp.Data.Result {
		val, ok := parseInterfaceAsInt(rst.Value[1])
		if !ok {
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

	return svc2MetricMap, nil
}

func parseInterfaceAsInt(i interface{}) (int, bool) {
	valInStr, ok := i.(string)
	if !ok {
		return 0, false
	}

	val, err := strconv.Atoi(valInStr)
	if err != nil {
		return 0, false
	}

	return val, true
}

func getIstioTCPMetricMap(ns string) (map[string]IstioMetric, error) {
	sentMap, err := getSentOrReceiveIstioTCPMetricMap(ns, true)
	if err != nil {
		return nil, err
	}

	receiveMap, err := getSentOrReceiveIstioTCPMetricMap(ns, false)
	if err != nil {
		return nil, err
	}

	// merge same svc into 1 recMetric
	for svcName, recMetric := range receiveMap {
		if _, exist := sentMap[svcName]; !exist {
			sentMap[svcName] = recMetric
			continue
		}

		sentMap[svcName].TCP.ReceivedBytesTotal += recMetric.TCP.ReceivedBytesTotal
	}

	return sentMap, nil
}

func getSentOrReceiveIstioTCPMetricMap(ns string, isSentData bool) (map[string]IstioMetric, error) {
	svcName := fmt.Sprintf(`.*.%s.svc.cluster.local`, ns)

	var query string
	if isSentData {
		query = fmt.Sprintf(`istio_tcp_sent_bytes_total{destination_service=~"%s"}`, svcName)
	} else {
		query = fmt.Sprintf(`istio_tcp_received_bytes_total{destination_service=~"%s"}`, svcName)
	}

	api := fmt.Sprintf("http://%s/api/v1/query?query=%s", hardCodedIstioPrometheusAPIHost, query)

	promResp, err := queryPrometheusAPI(api)
	if err != nil {
		return nil, err
	}

	svc2MetricMap := make(map[string]IstioMetric)
	for _, rst := range promResp.Data.Result {
		val, ok := parseInterfaceAsInt(rst.Value[1])
		if !ok {
			continue
		}

		svc, exist := rst.Metric["destination_service"]
		if !exist {
			continue
		}

		if _, exist := svc2MetricMap[svc]; !exist {
			svc2MetricMap[svc] = IstioMetric{
				TCP: &TCPMetric{},
			}
		}

		if isSentData {
			svc2MetricMap[svc].TCP.SentBytesTotal += val
		} else {
			svc2MetricMap[svc].TCP.ReceivedBytesTotal += val
		}
	}

	fmt.Println(api, len(svc2MetricMap), svc2MetricMap)

	return svc2MetricMap, nil
}

func queryPrometheusAPI(api string) (PromResponse, error) {
	resp, err := http.Get(api)
	if err != nil {
		return PromResponse{}, err
	}

	var promResp PromResponse
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return PromResponse{}, err
	}

	fmt.Printf("prom api: %s, resp: %s\n", api, body)

	err = json.Unmarshal(body, &promResp)
	if err != nil {
		fmt.Printf("fail to parse resp from prometheus, val: %s, err: %s\n", body, err)
		return PromResponse{}, err
	}

	return promResp, nil
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
