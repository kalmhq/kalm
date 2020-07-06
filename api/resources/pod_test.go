package resources

import (
	"encoding/json"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestUnmarshalPromResp(t *testing.T) {

	resp := `[
    {
        "metric": {
            "__name__": "istio_requests_total",
            "connection_security_policy": "unknown",
            "destination_app": "unknown",
            "destination_canonical_revision": "latest",
            "destination_canonical_service": "unknown",
            "destination_principal": "unknown",
            "destination_service": "kapp-dashboard.kapp-system.svc.cluster.local",
            "destination_service_name": "kapp-dashboard.kapp-system.svc.cluster.local",
            "destination_service_namespace": "unknown",
            "destination_version": "unknown",
            "destination_workload": "unknown",
            "destination_workload_namespace": "unknown",
            "instance": "10.24.0.118:15090",
            "job": "envoy-stats",
            "namespace": "istio-system",
            "pod_name": "istio-ingressgateway-74d4d8d459-cgkb7",
            "reporter": "source",
            "request_protocol": "http",
            "response_code": "200",
            "response_flags": "-",
            "source_app": "istio-ingressgateway",
            "source_canonical_revision": "latest",
            "source_canonical_service": "istio-ingressgateway",
            "source_principal": "unknown",
            "source_version": "unknown",
            "source_workload": "istio-ingressgateway",
            "source_workload_namespace": "istio-system"
        },
        "value": [
            1593599939.121,
            "10312"
        ]
    }
]`
	var rsts []PromMatrixResult
	err := json.Unmarshal([]byte(resp), &rsts)
	assert.Nil(t, err)
}
