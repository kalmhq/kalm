package resources

import (
	"encoding/json"
	"fmt"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"
)

var istioPrometheusAPIAddress string

func init() {
	if os.Getenv("KALM_ISTIO_PROMETHEUS_API_ADDRESS") != "" {
		istioPrometheusAPIAddress = os.Getenv("KALM_ISTIO_PROMETHEUS_API_ADDRESS")
	} else {
		istioPrometheusAPIAddress = "http://prometheus.istio-system:9090"
	}
}

type IstioMetricListChannel struct {
	// svc -> histories
	List  chan map[string]*IstioMetricHistories
	Error chan error
}

type IstioMetricHistories struct {
	//HTTP
	HTTPRequestsTotal    MetricHistory `json:"httpRequestsTotal,omitempty"`
	HTTPRespCode2XXCount MetricHistory `json:"httpRespCode2XXCount,omitempty"`
	HTTPRespCode4XXCount MetricHistory `json:"httpRespCode4XXCount,omitempty"`
	HTTPRespCode5XXCount MetricHistory `json:"httpRespCode5XXCount,omitempty"`

	//TCP
	TCPSentBytesTotal     MetricHistory `json:"tcpSentBytesTotal,omitempty"`
	TCPReceivedBytesTotal MetricHistory `json:"tcpReceivedBytesTotal,omitempty"`
}

func mergeIstioMetricHistories(a, b *IstioMetricHistories) *IstioMetricHistories {
	if a == nil {
		return b
	} else if b == nil {
		return a
	}

	rst := IstioMetricHistories{}

	rst.HTTPRequestsTotal = mergeMetricHistories(a.HTTPRequestsTotal, b.HTTPRequestsTotal)
	rst.HTTPRespCode2XXCount = mergeMetricHistories(a.HTTPRespCode2XXCount, b.HTTPRespCode2XXCount)
	rst.HTTPRespCode4XXCount = mergeMetricHistories(a.HTTPRespCode4XXCount, b.HTTPRespCode4XXCount)
	rst.HTTPRespCode5XXCount = mergeMetricHistories(a.HTTPRespCode5XXCount, b.HTTPRespCode5XXCount)
	rst.TCPReceivedBytesTotal = mergeMetricHistories(a.TCPReceivedBytesTotal, b.TCPReceivedBytesTotal)
	rst.TCPSentBytesTotal = mergeMetricHistories(a.TCPSentBytesTotal, b.TCPSentBytesTotal)

	return &rst
}

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

// map of {svc -> istioMetricHistories}
func getIstioMetricHistoriesMap(ns string) (map[string]*IstioMetricHistories, error) {
	svcName := fmt.Sprintf(`.*.%s.svc.cluster.local`, ns)

	httpRequestsTotal := fmt.Sprintf(`(sum by (destination_service) (istio_requests_total{destination_service=~"%s"})) `, svcName)
	resp2XX := fmt.Sprintf(`(sum by (destination_service) (istio_requests_total{destination_service=~"%s", response_code=~"2.*"})) `, svcName)
	resp4XX := fmt.Sprintf(`(sum by (destination_service) (istio_requests_total{destination_service=~"%s", response_code=~"4.*"})) `, svcName)
	resp5XX := fmt.Sprintf(`(sum by (destination_service) (istio_requests_total{destination_service=~"%s", response_code=~"5.*"})) `, svcName)
	sentBytes := fmt.Sprintf(`(sum by (destination_service) (istio_tcp_sent_bytes_total{destination_service=~"%s"}))`, svcName)
	receiveBytes := fmt.Sprintf(`(sum by (destination_service) (istio_tcp_received_bytes_total{destination_service=~"%s"}))`, svcName)

	queryMap := map[string]string{
		"httpRequestTotal": httpRequestsTotal,
		"httpResp2XX":      resp2XX,
		"httpResp4XX":      resp4XX,
		"httpResp5XX":      resp5XX,
		"tcpSentBytes":     sentBytes,
		"tcpReceiveBytes":  receiveBytes,
	}

	now := time.Now().Unix()
	startAs30MinAgo := now - 30*60
	stepAs1Min := 60

	svc2MetricHistoriesMap := make(map[string]*IstioMetricHistories)

	for k, query := range queryMap {

		api := fmt.Sprintf("%s/api/v1/query_range?query=%s&start=%d&end=%d&step=%d",
			istioPrometheusAPIAddress,
			url.QueryEscape(query),
			startAs30MinAgo,
			now,
			stepAs1Min,
		)

		promResp, err := queryPrometheusAPI(api)
		if err != nil {
			log.Warnf("err when queryPrometheusAPI(%s), err: %s, ignroed\n", api, err)
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
			case "httpRequestTotal":
				svc2MetricHistoriesMap[svc].HTTPRequestsTotal = metricPoints
			case "httpResp2XX":
				svc2MetricHistoriesMap[svc].HTTPRespCode2XXCount = metricPoints
			case "httpResp4XX":
				svc2MetricHistoriesMap[svc].HTTPRespCode4XXCount = metricPoints
			case "httpResp5XX":
				svc2MetricHistoriesMap[svc].HTTPRespCode5XXCount = metricPoints
			case "tcpSentBytes":
				svc2MetricHistoriesMap[svc].TCPSentBytesTotal = metricPoints
			case "tcpReceiveBytes":
				svc2MetricHistoriesMap[svc].TCPReceivedBytesTotal = metricPoints
			default:
				log.Warnln("unknown query key:", k)
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

	log.Debugf("prom api: %s, resp: %s\n", api, body)

	err = json.Unmarshal(body, &promResp)
	if err != nil {
		log.Warnf("fail to parse resp from prometheus, val: %s, err: %s\n", body, err)
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
