package resources

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"time"
)

var istioPrometheusAPIHOST string

func init() {
	if os.Getenv("KALM_ISTIO_PROMETHEUS_API_HOST") != "" {
		istioPrometheusAPIHOST = os.Getenv("KALM_ISTIO_PROMETHEUS_API_HOST")
	} else {
		istioPrometheusAPIHOST = "prometheus.istio-system:9090"
	}
}

type IstioMetricListChannel struct {
	// svc -> histories
	List  chan map[string]*IstioMetricHistories
	Error chan error
}

//type MetricHistory []MetricPoint

type IstioMetricHistories struct {
	//HTTP
	RequestsTotal    MetricHistory `json:"requestsTotal"`
	RespCode200Count MetricHistory `json:"respCode200Count"`
	RespCode400Count MetricHistory `json:"respCode400Count"`
	RespCode500Count MetricHistory `json:"respCode500Count"`

	//TCP
	SentBytesTotal     MetricHistory `json:"sentBytesTotal"`
	ReceivedBytesTotal MetricHistory `json:"receivedBytesTotal"`
}

func mergeIstioMetricHistories(a, b *IstioMetricHistories) *IstioMetricHistories {
	if a == nil {
		return b
	} else if b == nil {
		return a
	}

	rst := IstioMetricHistories{}

	rst.RequestsTotal = mergeMetricHistories(a.RequestsTotal, b.RequestsTotal)
	rst.RespCode200Count = mergeMetricHistories(a.RespCode200Count, b.RespCode200Count)
	rst.RespCode400Count = mergeMetricHistories(a.RespCode400Count, b.RespCode400Count)
	rst.RespCode500Count = mergeMetricHistories(a.RespCode500Count, b.RespCode500Count)
	rst.ReceivedBytesTotal = mergeMetricHistories(a.ReceivedBytesTotal, b.ReceivedBytesTotal)
	rst.SentBytesTotal = mergeMetricHistories(a.SentBytesTotal, b.SentBytesTotal)

	return &rst
}

func mergeMetricHistories(a, b MetricHistory) (rst MetricHistory) {
	sortMetricHistory(a)
	sortMetricHistory(b)

	i := 0
	j := 0
	for i < len(a) && j < len(b) {
		eleA := a[i]
		eleB := b[j]

		if eleA.Timestamp.Unix() == eleB.Timestamp.Unix() {
			rst = append(rst, MetricPoint{
				Timestamp: eleA.Timestamp,
				Value:     eleA.Value + eleB.Value,
			})

			i++
			j++
		} else if eleA.Timestamp.Unix() < eleB.Timestamp.Unix() {
			rst = append(rst, eleA)
			i++
		} else {
			rst = append(rst, eleB)
			j++
		}
	}

	rst = append(rst, a[i:]...)
	rst = append(rst, b[j:]...)

	return rst
}

func sortMetricHistory(a MetricHistory) {
	sort.Slice(a, func(i, j int) bool {
		return a[i].Timestamp.Unix() < a[j].Timestamp.Unix()
	})
}

//func mergeMap(a, b map[string]int) map[string]int {
//	rst := make(map[string]int)
//
//	for k, v := range a {
//		rst[k] += v
//	}
//	for k, v := range b {
//		rst[k] += v
//	}
//
//	return rst
//}

func (builder *Builder) GetIstioMetricsListChannel(ns string) *IstioMetricListChannel {
	channel := IstioMetricListChannel{
		List:  make(chan map[string]*IstioMetricHistories, 1),
		Error: make(chan error, 1),
	}

	go func() {
		httpSvc2MetricMap, err := getIstioMetricHistoriesMap(ns)

		channel.List <- httpSvc2MetricMap
		channel.Error <- err
	}()

	return &channel
}

//func concatErr(errSlice ...error) error {
//	var rstErr error
//	for _, err := range errSlice {
//		if err == nil {
//			continue
//		}
//
//		rstErr = fmt.Errorf("%s; %s", rstErr, err)
//	}
//
//	return rstErr
//}

// map of {svc -> istioMetricHistories}
func getIstioMetricHistoriesMap(ns string) (map[string]*IstioMetricHistories, error) {
	svcName := fmt.Sprintf(`.*.%s.svc.cluster.local`, ns)

	queryTotal := fmt.Sprintf(`(sum by (destination_service) (istio_requests_total{destination_service=~"%s"})) `, svcName)
	resp200 := fmt.Sprintf(`(sum by (destination_service) (istio_requests_total{destination_service=~"%s", response_code="200"})) `, svcName)
	resp400 := fmt.Sprintf(`(sum by (destination_service) (istio_requests_total{destination_service=~"%s", response_code="400"})) `, svcName)
	resp500 := fmt.Sprintf(`(sum by (destination_service) (istio_requests_total{destination_service=~"%s", response_code="500"})) `, svcName)
	sentBytes := fmt.Sprintf(`(sum by (destination_service) (istio_tcp_sent_bytes_total{destination_service=~"%s"}))`, svcName)
	receiveBytes := fmt.Sprintf(`(sum by (destination_service) (istio_tcp_received_bytes_total{destination_service=~"%s"}))`, svcName)

	queryMap := map[string]string{
		"requestTotal": queryTotal,
		"resp200":      resp200,
		"resp400":      resp400,
		"resp500":      resp500,
		"sentBytes":    sentBytes,
		"receiveBytes": receiveBytes,
	}

	now := time.Now().Unix()
	startAs30MinAgo := now - 30*60
	stepAs1Min := 60

	svc2MetricHistoriesMap := make(map[string]*IstioMetricHistories)

	for k, query := range queryMap {

		api := fmt.Sprintf("http://%s/api/v1/query_range?query=%s&start=%d&end=%d&step=%d",
			istioPrometheusAPIHOST,
			url.QueryEscape(query),
			startAs30MinAgo,
			now,
			stepAs1Min,
		)

		promResp, err := queryPrometheusAPI(api)
		if err != nil {
			fmt.Printf("err when queryPrometheusAPI(%s), err: %s, ignroed\n", api, err)
			return nil, err
		}

		// aggregate rsts by svc
		for _, rst := range promResp.Data.Result {

			svc, exist := rst.Metric["destination_service"]
			if !exist {
				continue
			}

			metricPoints := trans2MetricPoints(rst.Values)
			
			if _, exist := svc2MetricHistoriesMap[svc]; !exist {
				svc2MetricHistoriesMap[svc] = &IstioMetricHistories{}
			}

			switch k {
			case "requestTotal":
				svc2MetricHistoriesMap[svc].RequestsTotal = metricPoints
			case "resp200":
				svc2MetricHistoriesMap[svc].RespCode200Count = metricPoints
			case "resp400":
				svc2MetricHistoriesMap[svc].RespCode400Count = metricPoints
			case "resp500":
				svc2MetricHistoriesMap[svc].RespCode500Count = metricPoints
			case "sentBytes":
				svc2MetricHistoriesMap[svc].SentBytesTotal = metricPoints
			case "receiveBytes":
				svc2MetricHistoriesMap[svc].ReceivedBytesTotal = metricPoints
			default:
				fmt.Println("unknown query key:", k)
			}
		}
	}

	//for k, v := range svc2MetricHistoriesMap {
	//	fmt.Printf("svc2MetricHistoriesMap, k: %s, v: %+v\n", k, v)
	//}

	return svc2MetricHistoriesMap, nil
}

func trans2MetricPoints(value [][]interface{}) (rst []MetricPoint) {
	for _, v := range value {
		if len(v) != 2 {
			continue
		}

		t, ok1 := parseInterfaceAsTime(v[0])
		n, ok2 := parseInterfaceAsInt(v[1])
		if !ok1 || !ok2 {
			continue
		}

		rst = append(rst, MetricPoint{
			Timestamp: t,
			Value:     uint64(n),
		})
	}

	return
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

func parseInterfaceAsTime(i interface{}) (time.Time, bool) {
	val, ok := i.(float64)
	if !ok {
		fmt.Println("a")
		return time.Time{}, false
	}

	t := time.Unix(int64(val), 0)
	return t, true
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
		ResultType string             `json:"resultType"`
		Result     []PromMatrixResult `json:"result"`
	} `json:"data"`
}

type PromMatrixResult struct {
	Metric map[string]string `json:"metric"`
	Values [][]interface{}   `json:"values,string"`
}
