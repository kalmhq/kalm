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
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strings"
	"text/template"
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
}

type LogSystemComponentNames struct {
	Loki string `json:"loki"`
}

func (r *LogSystemReconcilerTask) getComponentNames() *LogSystemComponentNames {
	return &LogSystemComponentNames{
		Loki: fmt.Sprintf("%s-loki", r.req.Name),
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
	case corev1alpha1.LogSystemStackPKGMonolithic:
		return r.ReconcilePKGMonolithic()
	default:
		return fmt.Errorf("This stack is not yet implemented")
	}
}

func (r *LogSystemReconcilerTask) LoadPKGMonolithicResources() error {
	names := r.getComponentNames()

	var loki corev1alpha1.Component
	if err := r.Get(r.ctx, r.NameToNamespacedName(names.Loki), &loki); err != nil {
		if errors.IsNotFound(err) {
			return nil
		}

		return err
	}

	r.loki = &loki

	return nil
}

func (r *LogSystemReconcilerTask) ReconcilePKGMonolithic() error {
	if err := r.LoadPKGMonolithicResources(); err != nil {
		return err
	}

	names := r.getComponentNames()

	lokiImage := corev1alpha1.LokiImage

	if r.loki != nil {
		// Use the old image if exists
		// make sure we won't update loki image implicitly
		lokiImage = r.loki.Spec.Image
	}

	replicas := int32(1)

	lokiConfig := r.GetPKGMonolithicLokiConfig()

	loki := &corev1alpha1.Component{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: r.req.Namespace,
			Name:      names.Loki,
		},
		Spec: corev1alpha1.ComponentSpec{
			Image:        lokiImage,
			WorkloadType: corev1alpha1.WorkloadTypeStatefulSet,
			Replicas:     &replicas,
			Command:      "loki /etc/loki/loki.yaml",
			Ports: []corev1alpha1.Port{
				{
					ContainerPort: 3100,
					ServicePort:   3100,
					Protocol:      corev1alpha1.PortProtocolHTTP,
				},
			},
			// TODO Why the two probe is the same ??
			ReadinessProbe: &v1.Probe{
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
					StorageClassName: r.logSystem.Spec.PLGConfig.Loki.StorageClass,
					Type:             corev1alpha1.VolumeTypePersistentVolumeClaim,
					Path:             "/data",
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

func (r *LogSystemReconcilerTask) GetPKGMonolithicLokiConfig() string {
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
		Complete(r)
}

func NewLogSystemReconciler(mgr ctrl.Manager) *LogSystemReconciler {
	return &LogSystemReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "LogSystem"),
	}
}
