/*

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controllers

import (
	"context"
	"fmt"
	"strings"
	"text/template"

	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	v1 "k8s.io/api/core/v1"
	rbacV1 "k8s.io/api/rbac/v1"
	storageV1 "k8s.io/api/storage/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// LogSystemReconciler reconciles a LogSystem object
type LogSystemReconciler struct {
	*BaseReconciler
}

type LogSystemReconcilerTask struct {
	*LogSystemReconciler
	req       *ctrl.Request
	ctx       context.Context
	logSystem *corev1alpha1.LogSystem
	loki      *corev1alpha1.Component
	grafana   *corev1alpha1.Component
	promtail  *corev1alpha1.Component
}

type LogSystemComponentNames struct {
	Loki     string `json:"loki"`
	Grafana  string `json:"grafana"`
	Promtail string `json:"promtail"`
}

func (r *LogSystemReconcilerTask) getComponentNames() *LogSystemComponentNames {
	return &LogSystemComponentNames{
		Loki:     fmt.Sprintf("%s-loki", r.req.Name),
		Grafana:  fmt.Sprintf("%s-grafana", r.req.Name),
		Promtail: fmt.Sprintf("%s-promtail", r.req.Name),
	}
}

func (r *LogSystemReconcilerTask) NameToNamespacedName(name string) types.NamespacedName {
	return types.NamespacedName{
		Name:      name,
		Namespace: r.req.Namespace,
	}
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=logsystems,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=logsystems/status,verbs=get;update;patch

func (r *LogSystemReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	task := &LogSystemReconcilerTask{
		LogSystemReconciler: r,
		ctx:                 context.Background(),
		req:                 &req,
	}

	err := task.Run(req)
	return ctrl.Result{}, err
}

func (r *LogSystemReconcilerTask) Run(req ctrl.Request) error {
	if err := r.LoadResources(req); err != nil {
		return err
	}

	if r.logSystem == nil {
		return r.CleanResources()
	}

	if err := r.ReconcileResources(); err != nil {
		return err
	}

	return nil
}

func (r *LogSystemReconcilerTask) ReconcileResources() error {
	switch r.logSystem.Spec.Stack {
	case corev1alpha1.LogSystemStackPLGMonolithic:
		return r.ReconcilePLGMonolithic()
	default:
		return fmt.Errorf("This stack is not yet implemented")
	}
}

func (r *LogSystemReconcilerTask) LoadPLGMonolithicResources() error {
	names := r.getComponentNames()

	var loki corev1alpha1.Component
	if err := r.Get(r.ctx, r.NameToNamespacedName(names.Loki), &loki); err != nil {
		if errors.IsNotFound(err) {
			return nil
		}
		return err
	}
	r.loki = &loki

	var grafana corev1alpha1.Component
	if err := r.Get(r.ctx, r.NameToNamespacedName(names.Grafana), &grafana); err != nil {
		if errors.IsNotFound(err) {
			return nil
		}
		return err
	}
	r.grafana = &grafana

	var promtail corev1alpha1.Component
	if err := r.Get(r.ctx, r.NameToNamespacedName(names.Promtail), &promtail); err != nil {
		if errors.IsNotFound(err) {
			return nil
		}
		return err
	}
	r.promtail = &promtail

	return nil
}

func (r *LogSystemReconcilerTask) ReconcilePLGMonolithic() error {
	if err := r.LoadPLGMonolithicResources(); err != nil {
		return err
	}

	if err := r.ReconcilePLGMonolithicLoki(); err != nil {
		return err
	}

	if err := r.ReconcilePLGMonolithicGrafana(); err != nil {
		return err
	}

	if err := r.ReconcilePLGMonolithicPromtail(); err != nil {
		return err
	}

	return nil
}

func (r *LogSystemReconcilerTask) GetStorageClassName(specifiedStorageClass *string) (*string, error) {
	storageClass := specifiedStorageClass

	// if not nil, return
	if storageClass != nil {
		return storageClass, nil
	}

	// if the root sc is not nil, return
	if r.logSystem.Spec.StorageClass != nil {
		return r.logSystem.Spec.StorageClass, nil
	}

	var storageClasses storageV1.StorageClassList

	if err := r.List(r.ctx, &storageClasses); err != nil {
		return nil, err
	}

	// find and use the default sc
	for i := range storageClasses.Items {
		sc := storageClasses.Items[i]

		if sc.Annotations["storageclass.kubernetes.io/is-default-class"] == "true" {
			return &sc.Name, nil
		}
	}

	// This cluster doesn't have a default StorageClass
	// The admin have to give an explicit StorageClass
	err := fmt.Errorf("require Loki storageClass")
	r.EmitWarningEvent(r.logSystem, err, "Loki storageClass is not set and there is no default StorageClass")
	return nil, err
}

func (r *LogSystemReconcilerTask) ReconcilePLGMonolithicLoki() error {
	names := r.getComponentNames()

	lokiImage := r.logSystem.Spec.PLGConfig.Loki.Image

	if lokiImage == "" {
		lokiImage = corev1alpha1.LokiImage
	}

	if r.loki != nil {
		// Use the old image if exists
		// make sure we won't update loki image implicitly
		lokiImage = r.loki.Spec.Image
	}

	storageClass, err := r.GetStorageClassName(r.logSystem.Spec.PLGConfig.Loki.StorageClass)

	if err != nil {
		return err
	}

	replicas := int32(1)

	lokiConfig := r.GetPLGMonolithicLokiConfig()

	loki := &corev1alpha1.Component{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: r.req.Namespace,
			Name:      names.Loki,
		},
		Spec: corev1alpha1.ComponentSpec{
			Annotations: map[string]string{
				"sidecar.istio.io/inject":                         "false",
				"core.kalm.dev/podExt-securityContext-runAsGroup": "0",
				"core.kalm.dev/podExt-securityContext-runAsUser":  "0",
			},
			Image:        lokiImage,
			WorkloadType: corev1alpha1.WorkloadTypeStatefulSet,
			Replicas:     &replicas,
			Command:      "loki -config.file=/etc/loki/loki.yaml",
			Ports: []corev1alpha1.Port{
				{
					ContainerPort: 3100,
					ServicePort:   3100,
					Protocol:      corev1alpha1.PortProtocolHTTP,
				},
			},
			ReadinessProbe: &v1.Probe{
				InitialDelaySeconds: 15,
				PeriodSeconds:       10,
				SuccessThreshold:    1,
				TimeoutSeconds:      1,
				FailureThreshold:    3,
				Handler: v1.Handler{
					HTTPGet: &v1.HTTPGetAction{
						Path:   "/ready",
						Port:   intstr.FromInt(3100),
						Scheme: v1.URISchemeHTTP,
					},
				},
			},
			LivenessProbe: &v1.Probe{
				InitialDelaySeconds: 45,
				PeriodSeconds:       10,
				SuccessThreshold:    1,
				TimeoutSeconds:      1,
				FailureThreshold:    3,
				Handler: v1.Handler{
					HTTPGet: &v1.HTTPGetAction{
						Path:   "/ready",
						Port:   intstr.FromInt(3100),
						Scheme: v1.URISchemeHTTP,
					},
				},
			},
			PreInjectedFiles: []corev1alpha1.PreInjectFile{
				{
					MountPath: "/etc/loki/loki.yaml",
					Content:   lokiConfig,
					Runnable:  false,
				},
			},
			Volumes: []corev1alpha1.Volume{
				{
					Size:             *r.logSystem.Spec.PLGConfig.Loki.DiskSize,
					StorageClassName: storageClass,
					Type:             corev1alpha1.VolumeTypePersistentVolumeClaimTemplate,
					Path:             "/data",
					PVC:              "storage",
				},
			},
		},
	}

	if r.loki == nil {
		if err := ctrl.SetControllerReference(r.logSystem, loki, r.Scheme); err != nil {
			r.EmitWarningEvent(r.logSystem, err, "unable to set owner for loki")
			return err
		}

		if err := r.Create(r.ctx, loki); err != nil {
			r.EmitWarningEvent(r.logSystem, err, "unable to create loki component")
			return err
		}
	} else {
		copied := r.loki.DeepCopy()
		copied.Spec = loki.Spec

		if err := r.Patch(r.ctx, copied, client.MergeFrom(r.loki)); err != nil {
			r.Log.Error(err, "Patch loki component failed.")
			return err
		}
	}

	return nil
}

func (r *LogSystemReconcilerTask) ReconcilePLGMonolithicGrafana() error {
	names := r.getComponentNames()

	grafanaImage := r.logSystem.Spec.PLGConfig.Grafana.Image

	if grafanaImage == "" {
		grafanaImage = corev1alpha1.GrafanaImage
	}

	if r.grafana != nil {
		// Use the old image if exists
		// make sure we won't update grafana image implicitly
		grafanaImage = r.grafana.Spec.Image
	}

	replicas := int32(1)

	grafana := &corev1alpha1.Component{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: r.req.Namespace,
			Name:      names.Grafana,
		},
		Spec: corev1alpha1.ComponentSpec{
			Image:        grafanaImage,
			WorkloadType: corev1alpha1.WorkloadTypeServer,
			Replicas:     &replicas,
			Ports: []corev1alpha1.Port{

				{
					ContainerPort: 3000,
					ServicePort:   3000,
					Protocol:      corev1alpha1.PortProtocolHTTP,
				},
			},
			Env: []corev1alpha1.EnvVar{
				{
					Name:  "GF_AUTH_ANONYMOUS_ENABLED",
					Value: "true",
				},
				{
					Name:  "GF_AUTH_ANONYMOUS_ORG_ROLE",
					Value: "Admin",
				},
			},
			ReadinessProbe: &v1.Probe{
				PeriodSeconds:    10,
				SuccessThreshold: 1,
				TimeoutSeconds:   1,
				FailureThreshold: 3,
				Handler: v1.Handler{
					HTTPGet: &v1.HTTPGetAction{
						Path:   "/api/health",
						Port:   intstr.FromInt(3000),
						Scheme: v1.URISchemeHTTP,
					},
				},
			},
			LivenessProbe: &v1.Probe{
				InitialDelaySeconds: 60,
				PeriodSeconds:       10,
				SuccessThreshold:    1,
				TimeoutSeconds:      30,
				FailureThreshold:    10,
				Handler: v1.Handler{
					HTTPGet: &v1.HTTPGetAction{
						Path:   "/api/health",
						Port:   intstr.FromInt(3000),
						Scheme: v1.URISchemeHTTP,
					},
				},
			},
			PreInjectedFiles: []corev1alpha1.PreInjectFile{
				{
					MountPath: "/etc/grafana/provisioning/datasources/loki.yaml",
					Content: fmt.Sprintf(`
apiVersion: 1
datasources:
  - name: Loki
    type: loki
    access: proxy
    isDefault: true
    url: http://%s:3100
`, names.Loki),
					Runnable: false,
				},
			},
		},
	}

	if r.grafana == nil {
		if err := ctrl.SetControllerReference(r.logSystem, grafana, r.Scheme); err != nil {
			r.EmitWarningEvent(r.logSystem, err, "unable to set owner for grafana")
			return err
		}

		if err := r.Create(r.ctx, grafana); err != nil {
			r.EmitWarningEvent(r.logSystem, err, "unable to create grafana component")
			return err
		}
	} else {
		copied := r.grafana.DeepCopy()
		copied.Spec = grafana.Spec

		if err := r.Patch(r.ctx, copied, client.MergeFrom(r.grafana)); err != nil {
			r.Log.Error(err, "Patch grafana component failed.")
			return err
		}
	}

	return nil
}

func (r *LogSystemReconcilerTask) ReconcilePLGMonolithicPromtail() error {
	names := r.getComponentNames()

	promtailImage := r.logSystem.Spec.PLGConfig.Promtail.Image

	if promtailImage == "" {
		promtailImage = corev1alpha1.PromtailImage
	}

	if r.promtail != nil {
		// Use the old image if exists
		// make sure we won't update promtail image implicitly
		promtailImage = r.promtail.Spec.Image
	}

	promtailConfig := r.GetPLGMonolithicPromtailConfig()

	promtail := &corev1alpha1.Component{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: r.req.Namespace,
			Name:      names.Promtail,
		},
		Spec: corev1alpha1.ComponentSpec{
			Annotations: map[string]string{
				"sidecar.istio.io/inject": "false",
			},
			Image:        promtailImage,
			WorkloadType: corev1alpha1.WorkloadTypeDaemonSet,
			Command:      fmt.Sprintf("promtail -log.level=debug -print-config-stderr -config.file=/etc/promtail/promtail.yaml -client.url=http://%s:3100/loki/api/v1/push", names.Loki),
			Ports: []corev1alpha1.Port{
				{
					ContainerPort: 3101,
					ServicePort:   3101,
					Protocol:      corev1alpha1.PortProtocolHTTP,
				},
			},
			Env: []corev1alpha1.EnvVar{
				{
					Name:  "HOSTNAME",
					Type:  corev1alpha1.EnvVarTypeBuiltin,
					Value: corev1alpha1.EnvVarBuiltinHost,
				},
			},
			ReadinessProbe: &v1.Probe{
				PeriodSeconds:       10,
				SuccessThreshold:    1,
				TimeoutSeconds:      1,
				FailureThreshold:    5,
				InitialDelaySeconds: 10,
				Handler: v1.Handler{
					HTTPGet: &v1.HTTPGetAction{
						Path:   "/ready",
						Port:   intstr.FromInt(3101),
						Scheme: v1.URISchemeHTTP,
					},
				},
			},
			PreInjectedFiles: []corev1alpha1.PreInjectFile{
				{
					MountPath: "/etc/promtail/promtail.yaml",
					Content:   promtailConfig,
					Runnable:  false,
				},
			},
			Volumes: []corev1alpha1.Volume{
				{
					Path:     "/var/lib/docker/containers",
					HostPath: "/var/lib/docker/containers",
					Type:     corev1alpha1.VolumeTypeHostPath,
				},
				{
					Path:     "/var/log/pods",
					HostPath: "/var/log/pods",
					Type:     corev1alpha1.VolumeTypeHostPath,
				},
				{
					Path:     "/run/promtail",
					HostPath: "/run/promtail",
					Type:     corev1alpha1.VolumeTypeHostPath,
				},
			},
			RunnerPermission: &corev1alpha1.RunnerPermission{
				RoleType: "clusterRole",
				Rules: []rbacV1.PolicyRule{
					{
						APIGroups: []string{""},
						Resources: []string{"nodes", "nodes/proxy", "services", "endpoints", "pods"},
						Verbs:     []string{"get", "list", "watch"},
					},
				},
			},
		},
	}

	if r.promtail == nil {
		if err := ctrl.SetControllerReference(r.logSystem, promtail, r.Scheme); err != nil {
			r.EmitWarningEvent(r.logSystem, err, "unable to set owner for promtail")
			return err
		}

		if err := r.Create(r.ctx, promtail); err != nil {
			r.EmitWarningEvent(r.logSystem, err, "unable to create promtail component")
			return err
		}
	} else {
		copied := r.promtail.DeepCopy()
		copied.Spec = promtail.Spec

		if err := r.Patch(r.ctx, copied, client.MergeFrom(r.promtail)); err != nil {
			r.Log.Error(err, "Patch promtail component failed.")
			return err
		}
	}

	return nil
}

func (r *LogSystemReconcilerTask) GetPLGMonolithicPromtailConfig() string {
	return `
client:
  backoff_config:
    max_period: 5s
    max_retries: 20
    min_period: 100ms
  batchsize: 102400
  batchwait: 1s
  external_labels: {}
  timeout: 10s
positions:
  filename: /run/promtail/positions.yaml
server:
  http_listen_port: 3101
target_config:
  sync_period: 10s

scrape_configs:
- job_name: kubernetes-pods-name
  pipeline_stages:
    - docker: {}
    - tenant:
        source: namespace
  kubernetes_sd_configs:
  - role: pod
  relabel_configs:
  - source_labels:
    - __meta_kubernetes_pod_label_name
    target_label: __service__
  - source_labels:
    - __meta_kubernetes_pod_node_name
    target_label: __host__
  - action: drop
    regex: ''
    source_labels:
    - __service__
  - action: labelmap
    regex: __meta_kubernetes_pod_label_(.+)
  - action: replace
    replacement: $1
    separator: /
    source_labels:
    - __meta_kubernetes_namespace
    - __service__
    target_label: job
  - action: replace
    source_labels:
    - __meta_kubernetes_namespace
    target_label: namespace
  - action: replace
    source_labels:
    - __meta_kubernetes_pod_name
    target_label: pod
  - action: replace
    source_labels:
    - __meta_kubernetes_pod_container_name
    target_label: container
  - replacement: /var/log/pods/*$1/*.log
    separator: /
    source_labels:
    - __meta_kubernetes_pod_uid
    - __meta_kubernetes_pod_container_name
    target_label: __path__
- job_name: kubernetes-pods-app
  pipeline_stages:
    - docker: {}
    - tenant:
        source: namespace

  kubernetes_sd_configs:
  - role: pod
  relabel_configs:
  - action: drop
    regex: .+
    source_labels:
    - __meta_kubernetes_pod_label_name
  - source_labels:
    - __meta_kubernetes_pod_label_app
    target_label: __service__
  - source_labels:
    - __meta_kubernetes_pod_node_name
    target_label: __host__
  - action: drop
    regex: ''
    source_labels:
    - __service__
  - action: labelmap
    regex: __meta_kubernetes_pod_label_(.+)
  - action: replace
    replacement: $1
    separator: /
    source_labels:
    - __meta_kubernetes_namespace
    - __service__
    target_label: job
  - action: replace
    source_labels:
    - __meta_kubernetes_namespace
    target_label: namespace
  - action: replace
    source_labels:
    - __meta_kubernetes_pod_name
    target_label: pod
  - action: replace
    source_labels:
    - __meta_kubernetes_pod_container_name
    target_label: container
  - replacement: /var/log/pods/*$1/*.log
    separator: /
    source_labels:
    - __meta_kubernetes_pod_uid
    - __meta_kubernetes_pod_container_name
    target_label: __path__
- job_name: kubernetes-pods-direct-controllers
  pipeline_stages:
    - docker: {}
    - tenant:
        source: namespace

  kubernetes_sd_configs:
  - role: pod
  relabel_configs:
  - action: drop
    regex: .+
    separator: ''
    source_labels:
    - __meta_kubernetes_pod_label_name
    - __meta_kubernetes_pod_label_app
  - action: drop
    regex: '[0-9a-z-.]+-[0-9a-f]{8,10}'
    source_labels:
    - __meta_kubernetes_pod_controller_name
  - source_labels:
    - __meta_kubernetes_pod_controller_name
    target_label: __service__
  - source_labels:
    - __meta_kubernetes_pod_node_name
    target_label: __host__
  - action: drop
    regex: ''
    source_labels:
    - __service__
  - action: labelmap
    regex: __meta_kubernetes_pod_label_(.+)
  - action: replace
    replacement: $1
    separator: /
    source_labels:
    - __meta_kubernetes_namespace
    - __service__
    target_label: job
  - action: replace
    source_labels:
    - __meta_kubernetes_namespace
    target_label: namespace
  - action: replace
    source_labels:
    - __meta_kubernetes_pod_name
    target_label: pod
  - action: replace
    source_labels:
    - __meta_kubernetes_pod_container_name
    target_label: container
  - replacement: /var/log/pods/*$1/*.log
    separator: /
    source_labels:
    - __meta_kubernetes_pod_uid
    - __meta_kubernetes_pod_container_name
    target_label: __path__
- job_name: kubernetes-pods-indirect-controller
  pipeline_stages:
    - docker: {}
    - tenant:
        source: namespace

  kubernetes_sd_configs:
  - role: pod
  relabel_configs:
  - action: drop
    regex: .+
    separator: ''
    source_labels:
    - __meta_kubernetes_pod_label_name
    - __meta_kubernetes_pod_label_app
  - action: keep
    regex: '[0-9a-z-.]+-[0-9a-f]{8,10}'
    source_labels:
    - __meta_kubernetes_pod_controller_name
  - action: replace
    regex: '([0-9a-z-.]+)-[0-9a-f]{8,10}'
    source_labels:
    - __meta_kubernetes_pod_controller_name
    target_label: __service__
  - source_labels:
    - __meta_kubernetes_pod_node_name
    target_label: __host__
  - action: drop
    regex: ''
    source_labels:
    - __service__
  - action: labelmap
    regex: __meta_kubernetes_pod_label_(.+)
  - action: replace
    replacement: $1
    separator: /
    source_labels:
    - __meta_kubernetes_namespace
    - __service__
    target_label: job
  - action: replace
    source_labels:
    - __meta_kubernetes_namespace
    target_label: namespace
  - action: replace
    source_labels:
    - __meta_kubernetes_pod_name
    target_label: pod
  - action: replace
    source_labels:
    - __meta_kubernetes_pod_container_name
    target_label: container
  - replacement: /var/log/pods/*$1/*.log
    separator: /
    source_labels:
    - __meta_kubernetes_pod_uid
    - __meta_kubernetes_pod_container_name
    target_label: __path__
- job_name: kubernetes-pods-static
  pipeline_stages:
    - docker: {}
    - tenant:
        source: namespace
  kubernetes_sd_configs:
  - role: pod
  relabel_configs:
  - action: drop
    regex: ''
    source_labels:
    - __meta_kubernetes_pod_annotation_kubernetes_io_config_mirror
  - action: replace
    source_labels:
    - __meta_kubernetes_pod_label_component
    target_label: __service__
  - source_labels:
    - __meta_kubernetes_pod_node_name
    target_label: __host__
  - action: drop
    regex: ''
    source_labels:
    - __service__
  - action: labelmap
    regex: __meta_kubernetes_pod_label_(.+)
  - action: replace
    replacement: $1
    separator: /
    source_labels:
    - __meta_kubernetes_namespace
    - __service__
    target_label: job
  - action: replace
    source_labels:
    - __meta_kubernetes_namespace
    target_label: namespace
  - action: replace
    source_labels:
    - __meta_kubernetes_pod_name
    target_label: pod
  - action: replace
    source_labels:
    - __meta_kubernetes_pod_container_name
    target_label: container
  - replacement: /var/log/pods/*$1/*.log
    separator: /
    source_labels:
    - __meta_kubernetes_pod_annotation_kubernetes_io_config_mirror
    - __meta_kubernetes_pod_container_name
    target_label: __path__
`

}

func (r *LogSystemReconcilerTask) GetPLGMonolithicLokiConfig() string {
	var retention_deletes_enabled bool
	var retention_period, max_look_back_period, reject_old_samples_max_age, period string

	if r.logSystem.Spec.PLGConfig.Loki.RetentionDays == 0 {
		retention_deletes_enabled = false
		retention_period = "0s"
		max_look_back_period = "0s"
		reject_old_samples_max_age = "0s"
		period = "168h"
	} else {
		days := r.logSystem.Spec.PLGConfig.Loki.RetentionDays
		retention_deletes_enabled = true
		retention_period = fmt.Sprintf("%dh", days*24)
		max_look_back_period = fmt.Sprintf("%dh", days*24)
		reject_old_samples_max_age = fmt.Sprintf("%dh", days*24)
		period = "168h"
	}

	data := map[string]interface{}{
		"retention_deletes_enabled":  retention_deletes_enabled,
		"retention_period":           retention_period,
		"max_look_back_period":       max_look_back_period,
		"reject_old_samples_max_age": reject_old_samples_max_age,
		"period":                     period,
	}

	t := template.Must(template.New("loki-config").Parse(`auth_enabled: false
server:
  http_listen_port: 3100
ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s
  max_transfer_retries: 0
schema_config:
  configs:
    - from: 2018-04-15
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: {{ .period }}
storage_config:
  boltdb:
    directory: /data/loki/index
  filesystem:
    directory: /data/loki/chunks
limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: {{ .reject_old_samples_max_age }}
chunk_store_config:
  max_look_back_period: {{ .max_look_back_period }}
table_manager:
  retention_deletes_enabled: {{ .retention_deletes_enabled }}
  retention_period: {{ .retention_period }}
`))

	strBuffer := &strings.Builder{}

	_ = t.Execute(strBuffer, data)

	return strBuffer.String()
}

func (r *LogSystemReconcilerTask) CleanResources() error {
	names := r.getComponentNames()

	if r.loki != nil {
		if err := r.Delete(r.ctx, &corev1alpha1.Component{
			ObjectMeta: metav1.ObjectMeta{Name: names.Loki, Namespace: r.req.Namespace},
		}); err != nil {
			return err
		}
	}

	if r.grafana != nil {
		if err := r.Delete(r.ctx, &corev1alpha1.Component{
			ObjectMeta: metav1.ObjectMeta{Name: names.Grafana, Namespace: r.req.Namespace},
		}); err != nil {
			return err
		}
	}

	if r.promtail != nil {
		if err := r.Delete(r.ctx, &corev1alpha1.Component{
			ObjectMeta: metav1.ObjectMeta{Name: names.Promtail, Namespace: r.req.Namespace},
		}); err != nil {
			return err
		}
	}

	return nil
}

func (r *LogSystemReconcilerTask) LoadResources(req ctrl.Request) error {
	var logSystem corev1alpha1.LogSystem
	if err := r.Get(r.ctx, req.NamespacedName, &logSystem); err != nil {
		if errors.IsNotFound(err) {
			return nil
		}

		return err
	}

	r.logSystem = &logSystem
	return nil
}

func (r *LogSystemReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.LogSystem{}).
		Owns(&corev1alpha1.Component{}).
		Complete(r)
}

func NewLogSystemReconciler(mgr ctrl.Manager) *LogSystemReconciler {
	return &LogSystemReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "LogSystem"),
	}
}
