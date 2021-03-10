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

package v1alpha1

import (
	"fmt"

	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// log is for logging in this package.
var logsystemlog = logf.Log.WithName("logsystem-resource")

func (r *LogSystem) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-logsystem,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=logsystems,verbs=create;update,versions=v1alpha1,name=mlogsystem.kb.io

var _ webhook.Defaulter = &LogSystem{}

// Default implements webhook.Defaulter so a webhook will be registered for the type
func (r *LogSystem) Default() {
	logsystemlog.Info("default", "name", r.Name)

	switch r.Spec.Stack {
	case LogSystemStackPLGMonolithic:
		if r.Spec.PLGConfig == nil {
			r.Spec.PLGConfig = &PLGConfig{}
		}

		if r.Spec.PLGConfig.Grafana == nil {
			r.Spec.PLGConfig.Grafana = &GrafanaConfig{}
		}

		if r.Spec.PLGConfig.Promtail == nil {
			r.Spec.PLGConfig.Promtail = &PromtailConfig{}
		}

		if r.Spec.PLGConfig.Loki == nil {
			r.Spec.PLGConfig.Loki = &LokiConfig{}
		}

		if r.Spec.PLGConfig.Loki.Image == "" {
			r.Spec.PLGConfig.Loki.Image = LokiImage
		}

		if r.Spec.PLGConfig.Loki.DiskSize == nil {
			quantity := resource.MustParse(DefaultLokiDiskSize)
			r.Spec.PLGConfig.Loki.DiskSize = &quantity
		}

		if r.Spec.PLGConfig.Loki.DiskSize == nil {
			quantity := resource.MustParse(DefaultLokiDiskSize)
			r.Spec.PLGConfig.Loki.DiskSize = &quantity
		}

		if r.Spec.PLGConfig.Grafana.Image == "" {
			r.Spec.PLGConfig.Grafana.Image = GrafanaImage
		}

		if r.Spec.PLGConfig.Promtail.Image == "" {
			r.Spec.PLGConfig.Promtail.Image = PromtailImage
		}
	}
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kalm-dev-v1alpha1-logsystem,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=logsystems,versions=v1alpha1,name=vlogsystem.kb.io

var _ webhook.Validator = &LogSystem{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *LogSystem) ValidateCreate() error {
	logsystemlog.Info("validate create", "name", r.Name)

	return r.validate()
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *LogSystem) ValidateUpdate(old runtime.Object) error {
	logsystemlog.Info("validate update", "name", r.Name)

	return r.validate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *LogSystem) ValidateDelete() error {
	logsystemlog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *LogSystem) validate() error {
	var rst KalmValidateErrorList

	switch r.Spec.Stack {
	case LogSystemStackPLGMonolithic:
		if r.Spec.PLGConfig == nil {
			rst = append(rst, KalmValidateError{
				Err:  fmt.Sprintf("plg config can't be blank when using %s stack", r.Spec.Stack),
				Path: "spec.plgConfig",
			})
			break
		}

		if r.Spec.PLGConfig.Loki == nil {
			rst = append(rst, KalmValidateError{
				Err:  fmt.Sprintf("loki config can't be blank when using %s stack", r.Spec.Stack),
				Path: "spec.plgConfig.loki",
			})
			break
		}

		if r.Spec.PLGConfig.Grafana == nil {
			rst = append(rst, KalmValidateError{
				Err:  fmt.Sprintf("grafana config can't be blank when using %s stack", r.Spec.Stack),
				Path: "spec.plgConfig.grafana",
			})
			break
		}

		if r.Spec.PLGConfig.Promtail == nil {
			rst = append(rst, KalmValidateError{
				Err:  fmt.Sprintf("promtail config can't be blank when using %s stack", r.Spec.Stack),
				Path: "spec.plgConfig.promtail",
			})
			break
		}

		if r.Spec.PLGConfig.Loki.Image == "" {
			rst = append(rst, KalmValidateError{
				Err:  "loki image can't be blank",
				Path: "spec.plgConfig.loki.image",
			})
			break
		}

		if r.Spec.PLGConfig.Grafana.Image == "" {
			rst = append(rst, KalmValidateError{
				Err:  "grafana image can't be blank",
				Path: "spec.plgConfig.grafana.image",
			})
			break
		}

		if r.Spec.PLGConfig.Promtail.Image == "" {
			rst = append(rst, KalmValidateError{
				Err:  "promtail image can't be blank",
				Path: "spec.plgConfig.promtail.image",
			})
			break
		}

	default:
		rst = append(rst, KalmValidateError{
			Err:  fmt.Sprintf("unknown stack: %s", r.Spec.Stack),
			Path: "spec.stack",
		})
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}
