package resources

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/kalmhq/kalm/api/log"
	"go.uber.org/zap"
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
	HTTPRequestBytes     MetricHistory `json:"httpRequestBytes,omitempty"`
	HTTPResponseBytes    MetricHistory `json:"httpResponseBytes,omitempty"`

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
	rst.HTTPRequestBytes = mergeMetricHistories(a.HTTPRequestBytes, b.HTTPRequestBytes)
	rst.HTTPResponseBytes = mergeMetricHistories(a.HTTPResponseBytes, b.HTTPResponseBytes)
	rst.TCPReceivedBytesTotal = mergeMetricHistories(a.TCPReceivedBytesTotal, b.TCPReceivedBytesTotal)
	rst.TCPSentBytesTotal = mergeMetricHistories(a.TCPSentBytesTotal, b.TCPSentBytesTotal)

	return &rst
}

func (resourceManager *ResourceManager) GetIstioMetricsListChannel(ns string) *IstioMetricListChannel {
	channel := IstioMetricListChannel{
		List:  make(chan map[string]*IstioMetricHistories, 1),
		Error: make(chan error, 1),
	}

	go func() {

		if os.Getenv("KALM_SKIP_ISTIO_METRICS") != "" {
			channel.List <- nil
			channel.Error <- nil
			return
		}

		httpSvc2MetricMap, err := getIstioMetricHistoriesMap(ns)
		channel.List <- httpSvc2MetricMap
		channel.Error <- err
	}()

	return &channel
}

// map of {svc -> istioMetricHistories}
func getIstioMetricHistoriesMap(ns string) (map[string]*IstioMetricHistories, error) {
	svcName := fmt.Sprintf(`.*.%s.svc.cluster.local`, ns)

	httpRequestsTotal := fmt.Sprintf(`istio:istio_requests_total:by_destination_service:rate5m{destination_service=~"%s"}`, svcName)
	resp2XX := fmt.Sprintf(`istio:istio_requests_total:by_destination_service:resp2xx_rate5m{destination_service=~"%s"}`, svcName)
	resp4XX := fmt.Sprintf(`istio:istio_requests_total:by_destination_service:resp4xx_rate5m{destination_service=~"%s"}`, svcName)
	resp5XX := fmt.Sprintf(`istio:istio_requests_total:by_destination_service:resp5xx_rate5m{destination_service=~"%s"}`, svcName)
	requestBytes := fmt.Sprintf(`istio:istio_request_bytes_sum:by_destination_service:rate5m{destination_service=~"%s"}`, svcName)
	responseBytes := fmt.Sprintf(`istio:istio_response_bytes_sum:by_destination_service:rate5m{destination_service=~"%s"}`, svcName)
	sentBytes := fmt.Sprintf(`istio:istio_tcp_sent_bytes_total:by_destination_service:rate5m{destination_service=~"%s"}`, svcName)
	receiveBytes := fmt.Sprintf(`istio:istio_tcp_received_bytes_total:by_destination_service:rate5m{destination_service=~"%s"}`, svcName)

	queryMap := map[string]string{
		"httpRequestsTotal": httpRequestsTotal,
		"httpResp2XX":       resp2XX,
		"httpResp4XX":       resp4XX,
		"httpResp5XX":       resp5XX,
		"httpRequestBytes":  requestBytes,
		"httpRespBytes":     responseBytes,
		"tcpSentBytes":      sentBytes,
		"tcpReceiveBytes":   receiveBytes,
	}

	now := time.Now().Unix()
	startAs30MinAgo := now - 30*60
	stepAs1Min := 60

	svc2MetricHistoriesMap := make(map[string]*IstioMetricHistories)

	type respContent struct {
		Key  string
		Resp PromResponse
		Err  error
	}

	respContentChan := make(chan respContent, len(queryMap))

	for k, query := range queryMap {
		api := fmt.Sprintf("%s/api/v1/query_range?query=%s&start=%d&end=%d&step=%d",
			istioPrometheusAPIAddress,
			url.QueryEscape(query),
			startAs30MinAgo,
			now,
			stepAs1Min,
		)

		go func(k, api string) {
			promResp, err := queryPrometheusAPI(api)

			if err != nil {
				log.Debug("err when queryPrometheusAPI, ignored", zap.String("api", api), zap.Error(err))
			}

			respContentChan <- respContent{
				Key:  k,
				Resp: promResp,
				Err:  err,
			}
		}(k, api)
	}

	cnt := 0
	for resp := range respContentChan {
		cnt++

		if resp.Err != nil {
			if cnt == len(queryMap) {
				break
			}

			continue
		}

		k := resp.Key
		promResp := resp.Resp

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
			case "httpRequestsTotal":
				svc2MetricHistoriesMap[svc].HTTPRequestsTotal = metricPoints
			case "httpResp2XX":
				svc2MetricHistoriesMap[svc].HTTPRespCode2XXCount = metricPoints
			case "httpResp4XX":
				svc2MetricHistoriesMap[svc].HTTPRespCode4XXCount = metricPoints
			case "httpResp5XX":
				svc2MetricHistoriesMap[svc].HTTPRespCode5XXCount = metricPoints
			case "httpRequestBytes":
				svc2MetricHistoriesMap[svc].HTTPRequestBytes = metricPoints
			case "httpRespBytes":
				svc2MetricHistoriesMap[svc].HTTPResponseBytes = metricPoints
			case "tcpSentBytes":
				svc2MetricHistoriesMap[svc].TCPSentBytesTotal = metricPoints
			case "tcpReceiveBytes":
				svc2MetricHistoriesMap[svc].TCPReceivedBytesTotal = metricPoints
			default:
				log.Info("unknown query key", zap.String("key", k))
			}
		}

		if cnt == len(queryMap) {
			break
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
		n, ok2 := parseInterfaceAsFloat(v[1])
		if !ok1 || !ok2 {
			continue
		}

		rst = append(rst, MetricPoint{
			Timestamp: t,
			Value:     n,
		})
	}

	return
}

func parseInterfaceAsFloat(i interface{}) (float64, bool) {
	valInStr, ok := i.(string)
	if !ok {
		return 0, false
	}

	val, err := strconv.ParseFloat(valInStr, 64)
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

	log.Debug("prom api", zap.String("api", api), zap.Any("resp", body))

	err = json.Unmarshal(body, &promResp)

	if err != nil {
		log.Error("fail to parse resp from prometheus", zap.Any("val", body), zap.Error(err))
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
