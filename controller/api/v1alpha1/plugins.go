package v1alpha1

import (
	"encoding/json"
	"k8s.io/api/apps/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

func GetPlugin(raw runtime.RawExtension) interface{} {
	var tmp struct {
		Name string `json:"name"`
		Type string `json:"type"`
	}

	_ = json.Unmarshal(raw.Raw, &tmp)

	if tmp.Name == "manual-scaler" {
		var p PluginManualScaler
		_ = json.Unmarshal(raw.Raw, &p)
		return &p
	}

	return tmp.Name
}

type PluginManualScaler struct {
	Name     string `json:"name"`
	Replicas uint32 `json:"replicas"`
}

func (p *PluginManualScaler) Operate(deployment *v1.Deployment) {
	var count int32
	count = int32(p.Replicas)
	deployment.Spec.Replicas = &count
}

type PluginIngress struct {
	Name  string   `json:"name"`
	Type  string   `json:"type"`
	Hosts []string `json:"hosts"`
	Path  string   `json:"path"`

	Namespace   string `json:"namespace"`
	ServiceName string `json:"serviceName"`
	ServicePort int    `json:"servicePort"`
	//todo more
}
