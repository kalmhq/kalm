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
	"crypto/md5"
	"encoding/base64"
	"encoding/json"
	"fmt"
	js "github.com/dop251/goja"
	"github.com/kalmhq/kalm/controller/lib/files"
	"github.com/kalmhq/kalm/controller/vm"
	"github.com/xeipuuv/gojsonschema"
	v1alpha32 "istio.io/api/networking/v1alpha3"
	"istio.io/client-go/pkg/apis/networking/v1alpha3"
	appsV1 "k8s.io/api/apps/v1"
	batchV1 "k8s.io/api/batch/v1"
	batchV1Beta1 "k8s.io/api/batch/v1beta1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"
	"path"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"
	"strings"

	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
)

const AnnoLastUpdatedByWebhook = "last-updated-by-webhook"

// ComponentReconciler reconciles a Component object
type ComponentReconciler struct {
	*BaseReconciler
}

type ComponentReconcilerTask struct {
	*ComponentReconciler

	// The following fields will be filled by calling SetupAttributes() function
	ctx       context.Context
	component *corev1alpha1.Component
	namespace coreV1.Namespace

	// related resources
	service         *coreV1.Service
	destinationRule *v1alpha3.DestinationRule
	headlessService *coreV1.Service
	cronJob         *batchV1Beta1.CronJob
	deployment      *appsV1.Deployment
	daemonSet       *appsV1.DaemonSet
	statefulSet     *appsV1.StatefulSet
	pluginBindings  *corev1alpha1.ComponentPluginBindingList
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=components,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=components/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=core.kalm.dev,resources=componentplugins,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=componentplugins/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=extensions,resources=deployments,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=extensions,resources=daemonsets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=apps,resources=statefulsets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=services,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=pods,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=persistentvolumeclaims,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=persistentvolume,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=batch,resources=cronjobs,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=networking.istio.io,resources=destinationrules,verbs=*

func (r *ComponentReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	r.Log.Info("reconciling component", "req", req)

	task := &ComponentReconcilerTask{
		ComponentReconciler: r,
		ctx:                 context.Background(),
	}

	return ctrl.Result{}, task.Run(req)
}

func (r *ComponentReconcilerTask) WarningEvent(err error, msg string, args ...interface{}) {
	r.EmitWarningEvent(r.component, err, msg, args...)
}

func (r *ComponentReconcilerTask) NormalEvent(reason, msg string, args ...interface{}) {
	r.EmitNormalEvent(r.component, reason, msg, args...)
}

func NewComponentReconciler(mgr ctrl.Manager) *ComponentReconciler {
	return &ComponentReconciler{
		NewBaseReconciler(mgr, "Component"),
	}
}

type ComponentPluginBindingsMapper struct {
	*BaseReconciler
}

func (r *ComponentPluginBindingsMapper) Map(object handler.MapObject) []reconcile.Request {
	if binding, ok := object.Object.(*corev1alpha1.ComponentPluginBinding); ok {
		if binding.Spec.ComponentName == "" {
			var componentList corev1alpha1.ComponentList
			err := r.Reader.List(context.Background(), &componentList, client.InNamespace(binding.Namespace))
			if err != nil {
				r.Log.Error(err, "Can't list components in mapper.")
				return nil
			}

			res := make([]reconcile.Request, len(componentList.Items))

			for i := range componentList.Items {
				res[i] = reconcile.Request{
					NamespacedName: types.NamespacedName{
						Name:      componentList.Items[i].Name,
						Namespace: binding.Namespace,
					},
				}
			}

			return res
		} else {
			return []reconcile.Request{
				{NamespacedName: types.NamespacedName{Name: binding.Spec.ComponentName, Namespace: binding.Namespace}},
			}
		}
	} else {
		return nil
	}
}

func (r *ComponentReconciler) SetupWithManager(mgr ctrl.Manager) error {
	if err := mgr.GetFieldIndexer().IndexField(context.Background(), &appsV1.Deployment{}, ownerKey, func(rawObj runtime.Object) []string {
		deployment := rawObj.(*appsV1.Deployment)
		owner := metaV1.GetControllerOf(deployment)

		if owner == nil {
			return nil
		}

		if owner.APIVersion != apiGVStr || owner.Kind != "Component" {
			return nil
		}

		return []string{owner.Name}
	}); err != nil {
		return err
	}

	if err := mgr.GetFieldIndexer().IndexField(context.Background(), &batchV1Beta1.CronJob{}, ownerKey, func(rawObj runtime.Object) []string {
		cronjob := rawObj.(*batchV1Beta1.CronJob)
		owner := metaV1.GetControllerOf(cronjob)

		if owner == nil {
			return nil
		}

		if owner.APIVersion != apiGVStr || owner.Kind != "Component" {
			return nil
		}

		return []string{owner.Name}
	}); err != nil {
		return err
	}

	if err := mgr.GetFieldIndexer().IndexField(context.Background(), &coreV1.Service{}, ownerKey, func(rawObj runtime.Object) []string {
		// grab the job object, extract the owner...
		service := rawObj.(*coreV1.Service)
		owner := metaV1.GetControllerOf(service)

		if owner == nil {
			return nil
		}

		if owner.APIVersion != apiGVStr || owner.Kind != "Component" {
			return nil
		}

		return []string{owner.Name}
	}); err != nil {
		return err
	}

	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Component{}).
		Watches(&source.Kind{Type: &corev1alpha1.ComponentPluginBinding{}}, &handler.EnqueueRequestsFromMapFunc{
			ToRequests: &ComponentPluginBindingsMapper{r.BaseReconciler},
		}).
		Owns(&appsV1.Deployment{}).
		Owns(&batchV1Beta1.CronJob{}).
		Owns(&appsV1.DaemonSet{}).
		Owns(&appsV1.StatefulSet{}).
		Owns(&coreV1.Service{}).
		Complete(r)
}
func (r *ComponentReconcilerTask) Run(req ctrl.Request) error {
	if err := r.SetupAttributes(req); err != nil {
		return client.IgnoreNotFound(err)
	}

	//if err := r.FixComponentDefaultValues(); err != nil {
	//	r.WarningEvent()(err, "Fix component default values error.")
	//	return ctrl.Result{}, err
	//}

	if err := r.LoadResources(); err != nil {
		return err
	}

	if !r.component.ObjectMeta.DeletionTimestamp.IsZero() {
		return nil
	}

	if err := r.ReconcileService(); err != nil {
		return err
	}

	if err := r.ReconcileComponentPluginBinding(); err != nil {
		return err
	}

	if err := r.ReconcileWorkload(); err != nil {
		return err
	}

	return nil
}

const (
	KalmLabelComponentKey = "kalm-component"
	KalmLabelNamespaceKey = "kalm-namespace"
)

func (r *ComponentReconcilerTask) GetLabels() map[string]string {
	return map[string]string{
		KalmLabelNamespaceKey: r.namespace.Name,
		KalmLabelComponentKey: r.component.Name,
		KalmLabelManaged:      "true",
	}
}

func (r *ComponentReconcilerTask) FixComponentDefaultValues() (err error) {
	if r.component == nil {
		return nil
	}

	if r.component.Spec.WorkloadType == "" {
		r.component.Spec.WorkloadType = corev1alpha1.WorkloadTypeServer
	}

	if r.component.Spec.DnsPolicy == "" {
		r.component.Spec.DnsPolicy = coreV1.DNSClusterFirst
	}

	if r.component.Spec.RestartPolicy == "" {
		r.component.Spec.RestartPolicy = coreV1.RestartPolicyAlways
	}

	if r.component.Spec.TerminationGracePeriodSeconds == nil {
		x := int64(30)
		r.component.Spec.TerminationGracePeriodSeconds = &x
	}

	if r.component.Spec.RestartStrategy == "" {
		r.component.Spec.RestartStrategy = appsV1.RollingUpdateDeploymentStrategyType
	}

	for i := range r.component.Spec.Env {
		if r.component.Spec.Env[i].Type == "" {
			r.component.Spec.Env[i].Type = corev1alpha1.EnvVarTypeStatic
		}
	}

	return r.Update(r.ctx, r.component)
}

func IsNamespaceKalmEnabled(namespace coreV1.Namespace) bool {
	if v, exist := namespace.Labels[KalmEnableLabelName]; !exist || v != KalmEnableLabelValue {
		return false
	}

	return true
}

func (r *ComponentReconcilerTask) ReconcileService() (err error) {
	labels := r.GetLabels()

	if !IsNamespaceKalmEnabled(r.namespace) {
		if r.service != nil {
			return r.Delete(r.ctx, r.service)
		}

		return nil
	}

	if len(r.component.Spec.Ports) > 0 {
		newService := false
		newHeadlessService := false

		if r.service == nil {
			newService = true
			r.service = &coreV1.Service{
				ObjectMeta: metaV1.ObjectMeta{
					Name:      r.component.Name,
					Namespace: r.component.Namespace,
					Labels:    labels,
				},
				Spec: coreV1.ServiceSpec{
					Selector: labels,
				},
			}
		}

		if r.component.Spec.WorkloadType == corev1alpha1.WorkloadTypeStatefulSet {
			r.component.Spec.EnableHeadlessService = true
		}

		if r.component.Spec.EnableHeadlessService && r.headlessService == nil {
			newHeadlessService = true
			r.headlessService = &coreV1.Service{
				ObjectMeta: metaV1.ObjectMeta{
					Name:      getNameForHeadlessService(r.component.Name),
					Namespace: r.component.Namespace,
					Labels:    labels,
				},
				Spec: coreV1.ServiceSpec{
					Selector:  labels,
					ClusterIP: "None",
				},
			}
		}

		var ps []coreV1.ServicePort
		for _, port := range r.component.Spec.Ports {
			// if service port is missing, set it same as containerPort
			if port.ServicePort == 0 && port.ContainerPort != 0 {
				port.ServicePort = port.ContainerPort
			}

			// https://istio.io/latest/docs/ops/configuration/traffic-management/protocol-selection/
			serverPortName := fmt.Sprintf("%s-%d", port.Protocol, port.ServicePort)

			sp := coreV1.ServicePort{
				Name:       serverPortName,
				TargetPort: intstr.FromInt(int(port.ContainerPort)),
				Port:       int32(port.ServicePort),
			}

			if port.Protocol == corev1alpha1.PortProtocolUDP {
				sp.Protocol = coreV1.ProtocolUDP
			} else {
				sp.Protocol = coreV1.ProtocolTCP
			}

			ps = append(ps, sp)
		}

		// TODO service ComponentPlugin call
		r.service.Spec.Ports = ps
		if newService {
			if err := ctrl.SetControllerReference(r.component, r.service, r.Scheme); err != nil {
				r.WarningEvent(err, "unable to set owner for Service")
				return err
			}

			if err := r.Create(r.ctx, r.service); err != nil {
				r.WarningEvent(err, "unable to create Service for Component")
				return err
			}

		} else {
			if err := r.Update(r.ctx, r.service); err != nil {
				r.WarningEvent(err, "unable to update Service for Component")
				return err
			}
		}

		if r.component.Spec.EnableHeadlessService || r.component.Spec.WorkloadType == corev1alpha1.WorkloadTypeStatefulSet {
			r.headlessService.Spec.Ports = ps
			if newHeadlessService {
				if err := ctrl.SetControllerReference(r.component, r.headlessService, r.Scheme); err != nil {
					r.WarningEvent(err, "unable to set owner for headlessService")
					return err
				}

				if err := r.Create(r.ctx, r.headlessService); err != nil {
					r.WarningEvent(err, "unable to create headlessService for Component")
					return err
				}
			} else {
				if err := r.Update(r.ctx, r.headlessService); err != nil {
					r.WarningEvent(err, "unable to update headlessService for Component")
					return err
				}
			}
		}

		destinationRule := &v1alpha3.DestinationRule{
			ObjectMeta: metaV1.ObjectMeta{
				Name:      r.component.Name,
				Namespace: r.component.Namespace,
			},
			Spec: v1alpha32.DestinationRule{
				Host: fmt.Sprintf("%s.%s.svc.cluster.local", r.component.Name, r.component.Namespace),
				TrafficPolicy: &v1alpha32.TrafficPolicy{

					PortLevelSettings: make([]*v1alpha32.TrafficPolicy_PortTrafficPolicy, len(r.component.Spec.Ports)),
				},
				ExportTo: []string{"*"},
			},
		}

		for i, port := range r.component.Spec.Ports {
			servicePort := port.ServicePort

			if servicePort == 0 {
				servicePort = port.ContainerPort
			}

			policy := &v1alpha32.TrafficPolicy_PortTrafficPolicy{
				Port: &v1alpha32.PortSelector{
					Number: servicePort,
				},
				LoadBalancer: &v1alpha32.LoadBalancerSettings{
					LbPolicy: &v1alpha32.LoadBalancerSettings_Simple{
						Simple: v1alpha32.LoadBalancerSettings_LEAST_CONN,
					},

					// TODO; ConsistentHash will be used for sticky session
					//LbPolicy: &v1alpha32.LoadBalancerSettings_ConsistentHash{
					//	ConsistentHash: &v1alpha32.LoadBalancerSettings_ConsistentHashLB{
					//		HashKey: &v1alpha32.LoadBalancerSettings_ConsistentHashLB_HttpCookie{
					//			HttpCookie: &v1alpha32.LoadBalancerSettings_ConsistentHashLB_HTTPCookie{
					//				Name: "kalm-sticky-session",
					//				Ttl: &protoTypes.Duration{
					//					Seconds: 10,
					//				},
					//			},
					//		},
					//	},
					//},
				},
			}

			// TODO, should we support to use https in a upstream server?
			if port.Protocol == corev1alpha1.PortProtocolHTTPS {
				policy.Tls = &v1alpha32.ClientTLSSettings{
					Mode: v1alpha32.ClientTLSSettings_SIMPLE,
				}
			}

			destinationRule.Spec.TrafficPolicy.PortLevelSettings[i] = policy
		}

		if r.destinationRule == nil {
			if err := ctrl.SetControllerReference(r.component, destinationRule, r.Scheme); err != nil {
				r.WarningEvent(err, "unable to set owner for DestinationRule")
				return err
			}

			if err := r.Create(r.ctx, destinationRule); err != nil {
				r.WarningEvent(err, "unable to create DestinationRule for Component")
				return err
			}

		} else {
			copied := r.destinationRule.DeepCopy()
			copied.Spec = destinationRule.Spec

			if err := r.Patch(r.ctx, copied, client.MergeFrom(r.destinationRule)); err != nil {
				r.WarningEvent(err, "unable to patch DestinationRule for Component")
				return err
			}
		}

	}

	if len(r.component.Spec.Ports) == 0 {
		if r.service != nil {
			err := r.Delete(r.ctx, r.service)
			if err != nil {
				r.WarningEvent(err, "unable to delete Service for Application Component")
				return err
			}
		}

		if r.headlessService != nil {
			err := r.Delete(r.ctx, r.headlessService)
			if err != nil {
				r.WarningEvent(err, "unable to delete headlessService for Application Component")
				return err
			}
		}

		if r.destinationRule != nil {
			err := r.Delete(r.ctx, r.destinationRule)

			if err != nil {
				r.WarningEvent(err, "unable to delete destinationRule for Application Component")
				return err
			}
		}
	}

	return r.LoadService()
}

func getNameForHeadlessService(componentName string) string {
	return fmt.Sprintf("%s-headless", componentName)
}

func (r *ComponentReconcilerTask) ReconcileComponentPluginBinding() error {
	if r.pluginBindings == nil {
		return nil
	}

	for _, ele := range r.pluginBindings.Items {
		if err := ctrl.SetControllerReference(&ele, r.component, r.Scheme); err != nil {
			return err
		}
	}

	return nil
}

func (r *ComponentReconcilerTask) ReconcileWorkload() (err error) {

	if !IsNamespaceKalmEnabled(r.namespace) {
		if r.deployment != nil {
			if err := r.Delete(r.ctx, r.deployment); err != nil {
				return err
			}
		}
		if r.cronJob != nil {
			if err := r.Delete(r.ctx, r.cronJob); err != nil {
				return err
			}
		}
		if r.daemonSet != nil {
			if err := r.Delete(r.ctx, r.daemonSet); err != nil {
				return err
			}
		}
		if r.statefulSet != nil {
			if err := r.Delete(r.ctx, r.statefulSet); err != nil {
				return err
			}
		}

		return
	}

	if err := r.reconcileDirectConfigs(); err != nil {
		return err
	}

	if err := r.reconcilePermission(); err != nil {
		return err
	}

	template, err := r.GetPodTemplateWithoutVols()
	if err != nil {
		return err
	}

	switch r.component.Spec.WorkloadType {
	case corev1alpha1.WorkloadTypeServer, "":
		if err := r.prepareVolsForSimpleWorkload(template); err != nil {
			return err
		}

		return r.ReconcileDeployment(template)
	case corev1alpha1.WorkloadTypeCronjob:
		if err := r.prepareVolsForSimpleWorkload(template); err != nil {
			return err
		}

		return r.ReconcileCronJob(template)
	case corev1alpha1.WorkloadTypeDaemonSet:
		if err := r.prepareVolsForSimpleWorkload(template); err != nil {
			return err
		}

		return r.ReconcileDaemonSet(template)
	case corev1alpha1.WorkloadTypeStatefulSet:
		volClaimTemplates, err := r.prepareVolsForSTS(template)
		if err != nil {
			return err
		}

		return r.ReconcileStatefulSet(template, volClaimTemplates)
	default:
		return fmt.Errorf("unknown workload type: %s", string(r.component.Spec.WorkloadType))
	}
}

func (r *ComponentReconcilerTask) ReconcileDeployment(podTemplateSpec *coreV1.PodTemplateSpec) (err error) {
	component := r.component
	ctx := r.ctx
	deployment := r.deployment
	isNewDeployment := false
	labelMap := r.GetLabels()

	if deployment == nil {
		isNewDeployment = true

		deployment = &appsV1.Deployment{
			ObjectMeta: metaV1.ObjectMeta{
				Labels:      labelMap,
				Annotations: make(map[string]string),
				Name:        component.Name,
				Namespace:   r.namespace.Name,
			},
			Spec: appsV1.DeploymentSpec{
				Template: *podTemplateSpec,
				Selector: &metaV1.LabelSelector{
					MatchLabels: labelMap,
				},
			},
		}
	} else {
		deployment.Spec.Template = *podTemplateSpec
	}

	// inherit annotation: AnnoLastUpdatedByWebhook
	if v, exist := component.Annotations[AnnoLastUpdatedByWebhook]; exist {
		deployment.Annotations[AnnoLastUpdatedByWebhook] = v
	}

	if component.Spec.RestartStrategy != "" {
		deployment.Spec.Strategy = appsV1.DeploymentStrategy{
			Type: component.Spec.RestartStrategy,
		}
	} else {
		deployment.Spec.Strategy = appsV1.DeploymentStrategy{
			Type: appsV1.RollingUpdateDeploymentStrategyType,
		}
	}

	// TODO consider to move to plugin
	if component.Spec.Replicas != nil {
		deployment.Spec.Replicas = component.Spec.Replicas
	} else {
		deployment.Spec.Replicas = nil
	}

	//if len(component.Ports) > 0 {
	//	var ports []coreV1.ContainerPort
	//	for _, p := range component.Ports {
	//		ports = append(ports, coreV1.ContainerPort{
	//			Name:          p.Name,
	//			ContainerPort: int32(p.ContainerPort),
	//			Protocol:      p.Protocol,
	//		})
	//	}
	//}

	// apply plugins
	//for _, pluginDef := range component.Spec.Plugins {
	//	plugin := corev1alpha1.GetPlugin(pluginDef)
	//
	//	switch p := plugin.(type) {
	//	case *corev1alpha1.PluginManualScaler:
	//		p.Operate(deployment)
	//	}
	//}

	if err := ctrl.SetControllerReference(component, deployment, r.Scheme); err != nil {
		r.WarningEvent(err, "unable to set owner for deployment")
		return err
	}

	if err := r.runPlugins(ComponentPluginMethodBeforeDeploymentSave, component, deployment, deployment); err != nil {
		r.WarningEvent(err, "run before deployment save error.")
		return err
	}

	if isNewDeployment {
		if err := r.Create(ctx, deployment); err != nil {
			r.WarningEvent(err, "unable to create Deployment for Application")
			return err
		}

		r.NormalEvent("DeploymentCreated", deployment.Name+" is created.")
	} else {
		if err := r.Update(ctx, deployment); err != nil {
			r.WarningEvent(err, "unable to update Deployment for Application")
			return err
		}

		r.NormalEvent("DeploymentUpdated", deployment.Name+" is updated.")
	}

	// apply plugins
	//for _, pluginDef := range app.Spec.Components[0].Plugins {
	//	plugin := corev1alpha1.GetPlugin(pluginDef)
	//
	//	switch p := plugin.(type) {
	//	case *corev1alpha1.PluginManualScaler:
	//		p.Operate(deployment)
	//	}
	//}

	return nil
}

func (r *ComponentReconcilerTask) ReconcileDaemonSet(podTemplateSpec *coreV1.PodTemplateSpec) error {
	labelMap := r.GetLabels()

	daemonSet := r.daemonSet
	isNewDs := false

	if daemonSet == nil {
		isNewDs = true

		daemonSet = &appsV1.DaemonSet{
			ObjectMeta: metaV1.ObjectMeta{
				Labels:      labelMap,
				Annotations: make(map[string]string),
				Name:        r.component.Name,
				Namespace:   r.component.Namespace,
			},
			Spec: appsV1.DaemonSetSpec{
				Template: *podTemplateSpec,
				Selector: &metaV1.LabelSelector{
					MatchLabels: labelMap,
				},
			},
		}
	} else {
		daemonSet.Spec.Template = *podTemplateSpec
	}

	if isNewDs {
		if err := ctrl.SetControllerReference(r.component, daemonSet, r.Scheme); err != nil {
			r.WarningEvent(err, "unable to set owner for daemonSet")
			return err
		}

		if err := r.Create(r.ctx, daemonSet); err != nil {
			r.WarningEvent(err, "unable to create daemonSet for Component")
			return err
		}

		r.NormalEvent("DaemonSetCreated", daemonSet.Name+" is created.")
	} else {
		if err := r.Update(r.ctx, daemonSet); err != nil {
			r.WarningEvent(err, "unable to update daemonSet for Component")
			return err
		}

		r.NormalEvent("DaemonSetUpdated", daemonSet.Name+" is updated.")
	}

	return nil
}

func (r *ComponentReconcilerTask) ReconcileCronJob(podTemplateSpec *coreV1.PodTemplateSpec) (err error) {
	log := r.Log
	ctx := r.ctx
	cj := r.cronJob
	component := r.component
	labelMap := r.GetLabels()

	// restartPolicy
	if podTemplateSpec.Spec.RestartPolicy == coreV1.RestartPolicyAlways ||
		podTemplateSpec.Spec.RestartPolicy == "" {

		podTemplateSpec.Spec.RestartPolicy = coreV1.RestartPolicyOnFailure

	}

	successJobHistoryLimit := int32(3)
	failJobHistoryLimit := int32(5)

	desiredCJSpec := batchV1Beta1.CronJobSpec{
		Schedule: component.Spec.Schedule,
		JobTemplate: batchV1Beta1.JobTemplateSpec{
			Spec: batchV1.JobSpec{
				Template: *podTemplateSpec,
			},
		},
		SuccessfulJobsHistoryLimit: &successJobHistoryLimit,
		FailedJobsHistoryLimit:     &failJobHistoryLimit,
	}

	var isNewCJ bool
	if cj == nil {
		isNewCJ = true

		cj = &batchV1Beta1.CronJob{
			ObjectMeta: metaV1.ObjectMeta{
				Name:      component.Name,
				Namespace: r.namespace.Name,
				Labels:    labelMap,
			},
			Spec: desiredCJSpec,
		}
	} else {
		cj.Spec = desiredCJSpec
	}

	if isNewCJ {
		if err := ctrl.SetControllerReference(component, cj, r.Scheme); err != nil {
			r.WarningEvent(err, "unable to set owner for cronJob")
			return err
		}

		if err := r.Create(ctx, cj); err != nil {
			log.Error(err, "unable to create CronJob for Component")
			return err
		}

		r.NormalEvent("CronJobCreated", cj.Name+" is created.")
	} else {
		if err := r.Update(ctx, cj); err != nil {
			log.Error(err, "unable to update CronJob for Component")
			return err
		}

		r.NormalEvent("CronJobUpdated", cj.Name+" is updated.")
	}

	return nil
}

func (r *ComponentReconcilerTask) ReconcileStatefulSet(
	spec *coreV1.PodTemplateSpec,
	volClaimTemplates []coreV1.PersistentVolumeClaim,
) error {

	log := r.Log
	labelMap := r.GetLabels()

	sts := r.statefulSet

	isNewSts := false
	if sts == nil {
		isNewSts = true

		sts = &appsV1.StatefulSet{
			ObjectMeta: metaV1.ObjectMeta{
				Labels:      labelMap,
				Annotations: make(map[string]string),
				Name:        r.component.Name,
				Namespace:   r.component.Namespace,
			},
			Spec: appsV1.StatefulSetSpec{
				Template: *spec,
				Selector: &metaV1.LabelSelector{
					MatchLabels: labelMap,
				},
				VolumeClaimTemplates: volClaimTemplates,
			},
		}

		if r.headlessService != nil {
			sts.Spec.ServiceName = r.headlessService.Name
		}
	} else {
		// for sts, only 'replicas', 'template', and 'updateStrategy' are mutable
		// so no update for volClaimTemplate here
		sts.Spec.Template = *spec
	}

	if r.component.Spec.Replicas != nil {
		sts.Spec.Replicas = r.component.Spec.Replicas
	}

	if isNewSts {
		if err := ctrl.SetControllerReference(r.component, sts, r.Scheme); err != nil {
			log.Error(err, "unable to set owner for sts")
			return err
		}

		if err := r.Create(r.ctx, sts); err != nil {
			log.Error(err, "unable to create sts for Component")
			return err
		}

		r.NormalEvent("StatefulSetCreated", sts.Name+" is created.")
	} else {
		if err := r.Update(r.ctx, sts); err != nil {
			log.Error(err, "unable to update sts for Component")
			return err
		}

		r.NormalEvent("StatefulSetUpdated", sts.Name+" is updated.")
	}

	return nil
}

func (r *ComponentReconcilerTask) FixProbe(probe *coreV1.Probe) *coreV1.Probe {
	if probe == nil {
		return nil
	}

	if probe.Exec != nil {
		if len(probe.Exec.Command) == 1 && strings.Contains(probe.Exec.Command[0], " ") {
			probe.Exec.Command = []string{"sh", "-c", probe.Exec.Command[0]}
		}
	}

	return probe
}

func (r *ComponentReconcilerTask) GetPodTemplateWithoutVols() (template *coreV1.PodTemplateSpec, err error) {
	component := r.component

	labels := r.GetLabels()
	labels["app"] = component.Name
	labels["version"] = "v1" // TODO

	template = &coreV1.PodTemplateSpec{
		ObjectMeta: metaV1.ObjectMeta{
			Labels: labels,

			// The following is for set sidecar resources.
			Annotations: map[string]string{
				//"sidecar.istio.io/proxyCPU":         "100m",
				//"sidecar.istio.io/proxyMemory":      "50Mi",
				//"sidecar.istio.io/proxyCPULimit":    "100m",
				//"sidecar.istio.io/proxyMemoryLimit": "50Mi",
			},
		},
		Spec: coreV1.PodSpec{
			Containers: []coreV1.Container{
				{
					Name:  component.Name,
					Image: component.Spec.Image,
					Env:   []coreV1.EnvVar{},
					Resources: coreV1.ResourceRequirements{
						Requests: make(map[coreV1.ResourceName]resource.Quantity),
						Limits:   make(map[coreV1.ResourceName]resource.Quantity),
					},
					ReadinessProbe: r.FixProbe(component.Spec.ReadinessProbe),
					LivenessProbe:  r.FixProbe(component.Spec.LivenessProbe),
				},
			},
		},
	}

	// TODO are these values reasonable?
	template.ObjectMeta.Annotations["sidecar.istio.io/proxyCPULimit"] = "100m"
	template.ObjectMeta.Annotations["sidecar.istio.io/proxyMemoryLimit"] = "50Mi"

	//if component.Spec.EnableResourcesRequests {
	//	template.ObjectMeta.Annotations["sidecar.istio.io/proxyCPU"] = "10m"
	//	template.ObjectMeta.Annotations["sidecar.istio.io/proxyMemory"] = "50Mi"
	//}

	if v, exist := component.Annotations[AnnoLastUpdatedByWebhook]; exist {
		template.ObjectMeta.Annotations[AnnoLastUpdatedByWebhook] = v
	}

	mainContainer := &template.Spec.Containers[0]

	if component.Spec.TerminationGracePeriodSeconds != nil {
		template.Spec.TerminationGracePeriodSeconds = component.Spec.TerminationGracePeriodSeconds
	}

	if component.Spec.Command != "" {
		if strings.Contains(component.Spec.Command, " ") {
			mainContainer.Command = []string{"sh"}
			mainContainer.Args = []string{"-c", component.Spec.Command}
		} else {
			mainContainer.Command = []string{component.Spec.Command}
		}
	}

	var pullImageSecrets coreV1.SecretList
	if err := r.Client.List(
		r.ctx,
		&pullImageSecrets,
		client.MatchingLabels{"kalm-docker-registry-image-pull-secret": "true"},
		client.InNamespace(component.Namespace),
	); err != nil {
		r.WarningEvent(err, "get pull image secrets failed")
		return nil, err
	}

	pullImageSecretRefs := make([]coreV1.LocalObjectReference, len(pullImageSecrets.Items))
	for i, secret := range pullImageSecrets.Items {
		pullImageSecretRefs[i] = coreV1.LocalObjectReference{
			Name: secret.Name,
		}
	}

	if len(pullImageSecretRefs) > 0 {
		template.Spec.ImagePullSecrets = pullImageSecretRefs
	}

	//decide affinity
	if affinity, exist := r.decideAffinity(); exist {
		template.Spec.Affinity = affinity
	}

	if component.Spec.RunnerPermission != nil {
		template.Spec.ServiceAccountName = r.getNameForPermission()
	}

	// resource requirements
	resRequirements := component.Spec.ResourceRequirements
	if resRequirements != nil {
		mainContainer.Resources = *resRequirements
	}

	// apply envs
	var envs []coreV1.EnvVar
	for _, env := range component.Spec.Env {
		var value string
		var valueFrom *coreV1.EnvVarSource

		if env.Type == "" || env.Type == corev1alpha1.EnvVarTypeStatic {
			value = env.Value
		} else if env.Type == corev1alpha1.EnvVarTypeExternal {
			//value, err = r.FindShareEnvValue(env.Value)
			//
			////  if the env can't be found in sharedEnv, ignore it
			//if err != nil {
			//	continue
			//}
		} else if env.Type == corev1alpha1.EnvVarTypeLinked {
			value, err = r.getValueOfLinkedEnv(env)
			if err != nil {
				return nil, err
			}
		} else if env.Type == corev1alpha1.EnvVarTypeFieldRef {
			valueFrom = &coreV1.EnvVarSource{
				FieldRef: &coreV1.ObjectFieldSelector{
					FieldPath: env.Value,
				},
			}
		}

		envs = append(envs, coreV1.EnvVar{
			Name:      env.Name,
			Value:     value,
			ValueFrom: valueFrom,
		})
	}
	mainContainer.Env = envs

	err = r.runPlugins(ComponentPluginMethodAfterPodTemplateGeneration, component, template, template)
	if err != nil {
		r.WarningEvent(err, "run "+ComponentPluginMethodAfterPodTemplateGeneration+" save plugin error")
		return nil, err
	}

	return template, nil
}

func getVolName(componentName, diskPath string) string {
	return fmt.Sprintf("%s-%x", componentName, md5.Sum([]byte(diskPath)))
}

func (r *ComponentReconcilerTask) getValueOfLinkedEnv(env corev1alpha1.EnvVar) (string, error) {
	if env.Value == "" {
		return env.Value, nil
	}

	parts := strings.Split(env.Value, "/")
	if len(parts) != 2 {
		return "", fmt.Errorf("wrong componentPort config %s, format error", env.Value)
	}

	var service coreV1.Service
	err := r.Reader.Get(r.ctx, types.NamespacedName{
		Namespace: r.component.Namespace,
		Name:      parts[0],
	}, &service)

	if err != nil {
		return "", fmt.Errorf("wrong componentPort config %s, service not exist", env.Value)
	}

	var port int32
	for _, p := range service.Spec.Ports {
		if p.Name == parts[1] {
			port = p.Port
		}
	}

	if port == 0 {
		return "", fmt.Errorf("wrong componentPort config %s, port not exist", env.Value)
	}

	//svc.ns:port
	value := fmt.Sprintf("%s.%s:%d", service.Name, r.component.Namespace, port)

	//<prefix>value<suffix>
	return fmt.Sprintf("%s%s%s", env.Prefix, value, env.Suffix), nil
}

func (r *ComponentReconcilerTask) initPluginRuntime(component *corev1alpha1.Component) *js.Runtime {
	rt := vm.InitRuntime()

	rt.Set("getApplicationName", func(call js.FunctionCall) js.Value {
		return rt.ToValue(r.namespace.Name)
	})

	rt.Set("getCurrentComponent", func(call js.FunctionCall) js.Value {
		bts, _ := json.Marshal(component)
		var res map[string]interface{}
		_ = json.Unmarshal(bts, &res)
		return rt.ToValue(res)
	})

	return rt
}

func (r *ComponentReconcilerTask) runPlugins(methodName string, component *corev1alpha1.Component, desc interface{}, args ...interface{}) (err error) {

	if r.pluginBindings == nil {
		return nil
	}

	for _, binding := range r.pluginBindings.Items {
		if binding.DeletionTimestamp != nil || binding.Spec.IsDisabled {
			continue
		}

		if binding.Spec.ComponentName != "" && binding.Spec.ComponentName != component.Name {
			continue
		}

		pluginProgram, config, err := findPluginAndValidateConfigNew(&binding, methodName, component)

		if err != nil {
			return err
		}

		if pluginProgram == nil {
			continue
		}

		rt := r.initPluginRuntime(component)

		r.insertBuildInPluginImpls(rt, binding.Spec.PluginName, methodName, component, desc, args)

		// TODO refactor this filter
		if pluginProgram.Methods[ComponentPluginMethodComponentFilter] {
			shouldExecute := new(bool)

			err := vm.RunMethod(
				rt,
				pluginProgram.Program,
				ComponentPluginMethodComponentFilter,
				config,
				shouldExecute,
				component,
			)

			if err != nil {
				return err
			}

			if !*shouldExecute {
				continue
			}
		}

		err = vm.RunMethod(
			rt,
			pluginProgram.Program,
			methodName,
			config,
			desc,
			args...,
		)

		if err != nil {
			r.WarningEvent(err, fmt.Sprintf("Run plugin error. methodName: %s, componentName: %s, pluginName: %s", methodName, component.Name, binding.Spec.PluginName))
			return err
		}
	}

	return nil
}

func findPluginAndValidateConfigNew(pluginBinding *corev1alpha1.ComponentPluginBinding, methodName string, component *corev1alpha1.Component) (*ComponentPluginProgram, []byte, error) {
	pluginProgram := componentPluginsCache.Get(pluginBinding.Spec.PluginName)

	if pluginProgram == nil {
		return nil, nil, fmt.Errorf("Can't find plugin %s in cache.", pluginBinding.Spec.PluginName)
	}

	if !pluginProgram.Methods[methodName] {
		return nil, nil, nil
	}

	workloadType := component.Spec.WorkloadType

	if workloadType == "" {
		// TODO are we safe to remove this fallback value?
		workloadType = corev1alpha1.WorkloadTypeServer
	}

	if !pluginProgram.AvailableForAllWorkloadTypes && !pluginProgram.AvailableWorkloadTypes[workloadType] {
		return nil, nil, nil
	}

	if pluginProgram.ConfigSchema != nil {
		if pluginBinding.Spec.Config == nil {
			return nil, nil, fmt.Errorf("ComponentPlugin %s require configuration.", pluginBinding.Spec.PluginName)
		}

		pluginConfig := gojsonschema.NewStringLoader(string(pluginBinding.Spec.Config.Raw))
		res, err := pluginProgram.ConfigSchema.Validate(pluginConfig)

		if err != nil {
			return nil, nil, err
		}

		if !res.Valid() {
			return nil, nil, fmt.Errorf(res.Errors()[0].String())
		}

		return pluginProgram, pluginBinding.Spec.Config.Raw, nil
	}

	return pluginProgram, nil, nil
}

func (r *ComponentReconcilerTask) parseComponentConfigs(component *corev1alpha1.Component, volumes *[]coreV1.Volume, volumeMounts *[]coreV1.VolumeMount) {
	var configMap coreV1.ConfigMap

	err := r.Client.Get(r.ctx, types.NamespacedName{
		Name:      files.KALM_CONFIG_MAP_NAME,
		Namespace: r.component.Namespace,
	}, &configMap)

	if err != nil {
		r.WarningEvent(err, "can't get files config-map. Skip configs.")
		return
	}

	// key is mount dir, values is the files
	mountPaths := make(map[string]map[string]bool)

	for _, config := range component.Spec.Configs {
		mountPath := config.MountPath

		for _, path := range config.Paths {
			root, err := files.GetFileItemTree(&configMap, path)

			if err != nil {
				r.WarningEvent(err, fmt.Sprintf("can't find file item at %s", path))
				continue
			}

			files.ResolveMountPaths(mountPaths, mountPath, root)
		}
	}

	for mountPath, rawFileNamesMap := range mountPaths {
		name := fmt.Sprintf("configs-%x", md5.Sum([]byte(mountPath)))
		items := make([]coreV1.KeyToPath, 0, len(rawFileNamesMap))

		for itemRawFileName := range rawFileNamesMap {

			items = append(items, coreV1.KeyToPath{
				Path: files.GetFileNameFromRawPath(itemRawFileName),
				Key:  files.EncodeFilePath(itemRawFileName),
			})
		}

		volume := coreV1.Volume{
			Name: name,
			VolumeSource: coreV1.VolumeSource{
				ConfigMap: &coreV1.ConfigMapVolumeSource{
					LocalObjectReference: coreV1.LocalObjectReference{
						Name: files.KALM_CONFIG_MAP_NAME,
					},
					Items: items,
				},
			},
		}

		volumeMount := coreV1.VolumeMount{
			Name:      name,
			MountPath: mountPath,
		}

		*volumes = append(*volumes, volume)
		*volumeMounts = append(*volumeMounts, volumeMount)
	}

	// directConfigs
	for i, directConfig := range component.Spec.DirectConfigs {
		path := getPathOfDirectConfig(component.Name, i)

		name := fmt.Sprintf("direct-config-%s-%d", component.Name, i)

		vol := coreV1.Volume{
			Name: name,
			VolumeSource: coreV1.VolumeSource{
				ConfigMap: &coreV1.ConfigMapVolumeSource{
					LocalObjectReference: coreV1.LocalObjectReference{
						Name: files.KALM_CONFIG_MAP_NAME,
					},
					Items: []coreV1.KeyToPath{
						{
							Key:  files.EncodeFilePath(path),
							Path: "adhoc-name",
						},
					},
				},
			},
		}

		volMount := coreV1.VolumeMount{
			Name:      name,
			MountPath: directConfig.MountFilePath,
			SubPath:   "adhoc-name",
		}

		*volumes = append(*volumes, vol)
		*volumeMounts = append(*volumeMounts, volMount)
	}
}

func (r *ComponentReconcilerTask) getPVC(pvcName string) (*coreV1.PersistentVolumeClaim, error) {
	pvcList := coreV1.PersistentVolumeClaimList{}

	err := r.List(
		r.ctx,
		&pvcList,
		client.InNamespace(r.component.Namespace),
	)
	if err != nil {
		return nil, err
	}

	for _, item := range pvcList.Items {
		if item.Name == pvcName {
			return &item, nil
		}
	}

	return nil, nil
}

func (r *ComponentReconcilerTask) decideAffinity() (*coreV1.Affinity, bool) {
	component := &r.component.Spec

	var nodeSelectorTerms []coreV1.NodeSelectorTerm
	for label, v := range component.NodeSelectorLabels {
		nodeSelectorTerms = append(nodeSelectorTerms, coreV1.NodeSelectorTerm{
			MatchExpressions: []coreV1.NodeSelectorRequirement{
				{
					Key:      label,
					Operator: coreV1.NodeSelectorOpIn,
					Values:   []string{v},
				},
			},
		})
	}

	var nodeAffinity *coreV1.NodeAffinity
	if len(nodeSelectorTerms) > 0 {
		nodeAffinity = &coreV1.NodeAffinity{
			RequiredDuringSchedulingIgnoredDuringExecution: &coreV1.NodeSelector{
				NodeSelectorTerms: nodeSelectorTerms,
			},
		}
	}

	labelsOfThisComponent := r.GetLabels()

	var podAntiAffinity *coreV1.PodAntiAffinity
	if component.PreferNotCoLocated {
		podAntiAffinity = &coreV1.PodAntiAffinity{
			PreferredDuringSchedulingIgnoredDuringExecution: []coreV1.WeightedPodAffinityTerm{
				{
					Weight: 1,
					PodAffinityTerm: coreV1.PodAffinityTerm{
						TopologyKey: "kubernetes.io/hostname",
						LabelSelector: &metaV1.LabelSelector{
							MatchLabels: labelsOfThisComponent,
						},
					},
				},
			},
		}
	}

	if nodeAffinity == nil && podAntiAffinity == nil {
		return nil, false
	}

	return &coreV1.Affinity{
		NodeAffinity:    nodeAffinity,
		PodAntiAffinity: podAntiAffinity,
	}, true
}

func (r *ComponentReconcilerTask) SetupAttributes(req ctrl.Request) (err error) {
	var component corev1alpha1.Component
	err = r.Reader.Get(r.ctx, req.NamespacedName, &component)

	if err != nil {
		return err
	}
	r.component = &component

	var ns coreV1.Namespace
	err = r.Reader.Get(r.ctx, types.NamespacedName{
		Name: component.Namespace,
	}, &ns)

	if err != nil {
		//if errors.IsNotFound(err) && !r.component.DeletionTimestamp.IsZero() {
		//	return nil
		//}

		return err
	}
	r.namespace = ns
	return nil
}

func (r *ComponentReconcilerTask) DeleteResources() (err error) {
	if r.service != nil {
		if err := r.Client.Delete(r.ctx, r.service); client.IgnoreNotFound(err) != nil {
			r.WarningEvent(err, "Delete service error")
			return err
		}
	}

	if r.deployment != nil {
		if err := r.DeleteItem(r.deployment); client.IgnoreNotFound(err) != nil {
			return err
		}
	}

	if r.daemonSet != nil {
		if err := r.DeleteItem(r.daemonSet); client.IgnoreNotFound(err) != nil {
			return err
		}
	}

	if r.cronJob != nil {
		if err := r.DeleteItem(r.cronJob); client.IgnoreNotFound(err) != nil {
			return err
		}
	}

	if r.statefulSet != nil {
		if err := r.DeleteItem(r.statefulSet); client.IgnoreNotFound(err) != nil {
			return err
		}
	}

	var bindingList corev1alpha1.ComponentPluginBindingList

	if err := r.Reader.List(r.ctx, &bindingList, client.MatchingLabels{
		KalmLabelComponentKey: r.component.Name,
	}); client.IgnoreNotFound(err) != nil {
		r.WarningEvent(err, "get plugin binding list error.")
		return err
	}

	for _, binding := range bindingList.Items {
		if err := r.Delete(r.ctx, &binding); client.IgnoreNotFound(err) != nil {
			r.WarningEvent(err, "Delete plugin binding error.")
		}
	}

	return nil
}

func (r *ComponentReconcilerTask) DeleteItem(obj runtime.Object) (err error) {
	if err := r.Client.Delete(r.ctx, obj); err != nil {
		gvk := obj.GetObjectKind().GroupVersionKind()
		r.WarningEvent(err, fmt.Sprintf(" delete item error. Group: %s, Version: %s, Kind: %s", gvk.Group, gvk.Version, gvk.Kind))
		return err
	}

	return nil
}

func (r *ComponentReconcilerTask) LoadResources() (err error) {
	if err := r.LoadService(); err != nil {
		return err
	}

	if err := r.LoadComponentPluginBinding(); err != nil {
		return err
	}

	if err := r.LoadDestinationRule(); err != nil {
		return err
	}

	switch r.component.Spec.WorkloadType {
	case corev1alpha1.WorkloadTypeServer, "":
		return r.LoadDeployment()
	case corev1alpha1.WorkloadTypeCronjob:
		return r.LoadCronJob()
	case corev1alpha1.WorkloadTypeDaemonSet:
		return r.LoadDaemonSet()
	case corev1alpha1.WorkloadTypeStatefulSet:
		return r.LoadStatefulSet()
	}

	return nil
}

func (r *ComponentReconcilerTask) LoadDestinationRule() error {
	var rule v1alpha3.DestinationRule
	if err := r.Reader.Get(
		r.ctx,
		types.NamespacedName{
			Namespace: r.component.Namespace,
			Name:      r.component.Name,
		},
		&rule,
	); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}
	} else {
		r.destinationRule = &rule
	}

	return nil
}

func (r *ComponentReconcilerTask) LoadService() error {
	var service coreV1.Service
	if err := r.Reader.Get(
		r.ctx,
		types.NamespacedName{
			Namespace: r.component.Namespace,
			Name:      r.component.Name,
		},
		&service,
	); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}
	} else {
		r.service = &service
	}

	var headlessService coreV1.Service
	if err := r.Reader.Get(
		r.ctx,
		types.NamespacedName{
			Namespace: r.component.Namespace,
			Name:      getNameForHeadlessService(r.component.Name),
		},
		&headlessService,
	); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}
	} else {
		r.headlessService = &headlessService
	}

	return nil
}

func (r *ComponentReconcilerTask) LoadComponentPluginBinding() error {
	var bindings corev1alpha1.ComponentPluginBindingList

	if err := r.Reader.List(r.ctx, &bindings, client.InNamespace(r.component.Namespace)); err != nil {
		r.WarningEvent(err, "get plugin bindings error")
		return err
	}

	r.pluginBindings = &bindings

	return nil
}

func (r *ComponentReconcilerTask) LoadDeployment() error {
	var deploy appsV1.Deployment
	err := r.LoadItem(&deploy)
	if err != nil {
		return client.IgnoreNotFound(err)
	}
	r.deployment = &deploy
	return nil
}

func (r *ComponentReconcilerTask) LoadCronJob() error {
	var cornJob batchV1Beta1.CronJob
	err := r.LoadItem(&cornJob)
	if err != nil {
		return client.IgnoreNotFound(err)
	}
	r.cronJob = &cornJob
	return nil
}

func (r *ComponentReconcilerTask) LoadDaemonSet() error {
	var daemonSet appsV1.DaemonSet
	err := r.LoadItem(&daemonSet)
	if err != nil {
		return client.IgnoreNotFound(err)
	}
	r.daemonSet = &daemonSet
	return nil
}

func (r *ComponentReconcilerTask) LoadStatefulSet() error {
	var statefulSet appsV1.StatefulSet
	err := r.LoadItem(&statefulSet)
	if err != nil {
		return client.IgnoreNotFound(err)
	}
	r.statefulSet = &statefulSet
	return nil
}

func (r *ComponentReconcilerTask) LoadItem(dest runtime.Object) (err error) {
	if err := r.Reader.Get(
		r.ctx,
		types.NamespacedName{
			Namespace: r.component.Namespace,
			Name:      r.component.Name,
		},
		dest,
	); err != nil {
		return err
	}

	return nil
}

func (r *ComponentReconcilerTask) insertBuildInPluginImpls(rt *js.Runtime, pluginName, methodName string, component *corev1alpha1.Component, desc interface{}, args []interface{}) {
	// TODO
}

func isStatefulSet(component *corev1alpha1.Component) bool {
	return component.Spec.WorkloadType == corev1alpha1.WorkloadTypeStatefulSet
}

func (r *ComponentReconcilerTask) preparePreInjectedFiles(
	template *coreV1.PodTemplateSpec,
	volumes *[]coreV1.Volume,
	volumeMounts *[]coreV1.VolumeMount,
) error {
	component := r.component

	if len(component.Spec.PreInjectedFiles) <= 0 {
		return nil
	}

	*volumes = append(*volumes, coreV1.Volume{
		Name: "pre-injected-files-volume",
		VolumeSource: coreV1.VolumeSource{
			EmptyDir: &coreV1.EmptyDirVolumeSource{},
		},
	})

	if len(template.Spec.InitContainers) == 0 {
		template.Spec.InitContainers = []coreV1.Container{}
	}

	var injectCommands []string
	for _, file := range component.Spec.PreInjectedFiles {
		content := file.Content

		if !file.Base64 {
			content = base64.StdEncoding.EncodeToString([]byte(content))
		}

		baseName := fmt.Sprintf("%s.%x", path.Base(file.MountPath), md5.Sum([]byte(content)))

		cmd := fmt.Sprintf("echo \"%s\" | base64 -d > /files/%s && echo \"File %s created.\"", content, baseName, baseName)

		if file.Runnable {
			cmd += fmt.Sprintf(" && chmod +x /files/%s", baseName)
		}

		injectCommands = append(injectCommands, cmd)

		*volumeMounts = append(*volumeMounts, coreV1.VolumeMount{
			Name:      "pre-injected-files-volume",
			MountPath: file.MountPath,
			SubPath:   baseName,
			ReadOnly:  file.Readonly,
		})
	}

	template.Spec.InitContainers = append(template.Spec.InitContainers, coreV1.Container{
		Name:         "inject-files",
		Image:        "busybox",
		Command:      []string{"sh", "-c", fmt.Sprintf("%s", strings.Join(injectCommands, " && "))},
		VolumeMounts: []coreV1.VolumeMount{{MountPath: "/files", Name: "pre-injected-files-volume"}},
	})

	return nil
}

// STS has 2 kinds of volumes:
//
// - temp vol as podTemplate.volumes
// - persistent vol as volClaimTemplate
func (r *ComponentReconcilerTask) prepareVolsForSTS(template *coreV1.PodTemplateSpec) ([]coreV1.PersistentVolumeClaim, error) {
	component := r.component

	var volumes []coreV1.Volume
	var volumeMounts []coreV1.VolumeMount
	var volClaimTemplates []coreV1.PersistentVolumeClaim

	if err := r.preparePreInjectedFiles(template, &volumes, &volumeMounts); err != nil {
		return nil, err
	}

	for _, disk := range component.Spec.Volumes {
		// used in volumeMount, correspond to volume's name or volClaimTemplate's name
		volName := getVolName(component.Name, disk.Path)

		if disk.Type == corev1alpha1.VolumeTypeTemporaryDisk {
			volumes = append(volumes, coreV1.Volume{
				Name: volName,
				VolumeSource: coreV1.VolumeSource{
					EmptyDir: &coreV1.EmptyDirVolumeSource{
						Medium: coreV1.StorageMediumDefault,
					},
				},
			})
		} else if disk.Type == corev1alpha1.VolumeTypeTemporaryMemory {
			volumes = append(volumes, coreV1.Volume{
				Name: volName,
				VolumeSource: coreV1.VolumeSource{
					EmptyDir: &coreV1.EmptyDirVolumeSource{
						Medium: coreV1.StorageMediumMemory,
					},
				},
			})
		} else if disk.Type == corev1alpha1.VolumeTypePersistentVolumeClaim {

			pvcName := disk.PVC

			// for volClaimTemplate, volName == pvcName
			volName = pvcName

			var pvc *coreV1.PersistentVolumeClaim

			pvcFetched, err := r.getPVC(pvcName)
			if err != nil {
				return nil, err
			}

			if pvcFetched != nil {
				pvc = pvcFetched
			} else {
				expectedPVC := &coreV1.PersistentVolumeClaim{
					ObjectMeta: metaV1.ObjectMeta{
						Name:      pvcName,
						Namespace: r.component.Namespace,
						Labels:    r.GetLabels(),
					},
					Spec: coreV1.PersistentVolumeClaimSpec{
						AccessModes: []coreV1.PersistentVolumeAccessMode{coreV1.ReadWriteOnce},
						Resources: coreV1.ResourceRequirements{
							Requests: coreV1.ResourceList{
								coreV1.ResourceStorage: disk.Size,
							},
						},
						StorageClassName: disk.StorageClassName,
					},
				}

				pvc = expectedPVC
			}

			// claimTemplate for PVC
			volClaimTemplates = append(volClaimTemplates, *pvc)
		} else {
			return nil, fmt.Errorf("unknown disk type: %s", disk.Type)
		}

		// all mounted into container
		volumeMounts = append(volumeMounts, coreV1.VolumeMount{
			Name:      volName,
			MountPath: disk.Path,
		})
	}

	// set volumes & volMounts for podTemplate of STS
	template.Spec.Volumes = volumes

	mainContainer := &template.Spec.Containers[0]
	mainContainer.VolumeMounts = volumeMounts

	// for STS, pvc is not in podTemplate but in volumeClaimTemplate
	return volClaimTemplates, nil
}

// StatefulSet is very different when using PVC
// so all other workloads are simple except for STS
func (r *ComponentReconcilerTask) prepareVolsForSimpleWorkload(template *coreV1.PodTemplateSpec) error {
	component := r.component

	var volumes []coreV1.Volume
	var volumeMounts []coreV1.VolumeMount

	if err := r.preparePreInjectedFiles(template, &volumes, &volumeMounts); err != nil {
		return err
	}

	for _, disk := range component.Spec.Volumes {

		// used in volumeMount, correspond to volume's name or volClaimTemplate's name
		volName := getVolName(component.Name, disk.Path)

		if disk.Type == corev1alpha1.VolumeTypeTemporaryDisk {
			volumes = append(volumes, coreV1.Volume{
				Name: volName,
				VolumeSource: coreV1.VolumeSource{
					EmptyDir: &coreV1.EmptyDirVolumeSource{
						Medium: coreV1.StorageMediumDefault,
					},
				},
			})
		} else if disk.Type == corev1alpha1.VolumeTypeTemporaryMemory {
			volumes = append(volumes, coreV1.Volume{
				Name: volName,
				VolumeSource: coreV1.VolumeSource{
					EmptyDir: &coreV1.EmptyDirVolumeSource{
						Medium: coreV1.StorageMediumMemory,
					},
				},
			})
		} else if disk.Type == corev1alpha1.VolumeTypePersistentVolumeClaim {

			pvcName := disk.PVC
			volName = pvcName

			var pvc *coreV1.PersistentVolumeClaim
			pvcExist := false

			pvcFetched, err := r.getPVC(pvcName)
			if err != nil {
				return err
			}

			if pvcFetched != nil {
				pvc = pvcFetched
				pvcExist = true
			} else {
				expectedPVC := &coreV1.PersistentVolumeClaim{
					ObjectMeta: metaV1.ObjectMeta{
						Name:      pvcName,
						Namespace: r.component.Namespace,
						Labels:    r.GetLabels(),
					},
					Spec: coreV1.PersistentVolumeClaimSpec{
						AccessModes: []coreV1.PersistentVolumeAccessMode{coreV1.ReadWriteOnce},
						Resources: coreV1.ResourceRequirements{
							Requests: coreV1.ResourceList{
								coreV1.ResourceStorage: disk.Size,
							},
						},
						StorageClassName: disk.StorageClassName,
					},
				}

				// re-use existing PersistentVolume
				if disk.PVToMatch != "" {
					if expectedPVC.Spec.Selector == nil {
						expectedPVC.Spec.Selector = &metaV1.LabelSelector{}
					}

					expectedPVC.Spec.Selector.MatchLabels = map[string]string{
						KalmLabelPV: disk.PVToMatch,
					}

					// expectation: PVToMatch only need to be set when try to re-use pv from other ns,
					//   and pv's claimPolicy should be Retain (to make deletion of PVC safe)
					if err := r.reconcilePVForReUse(r.ctx, *expectedPVC, disk.PVToMatch); err != nil {
						return err
					}
				}

				pvc = expectedPVC
			}

			// create PVC if not exist yet
			if !pvcExist {
				err := r.Create(r.ctx, pvc)
				if err != nil {
					return fmt.Errorf("fail to create PVC: %s, %s", pvc.Name, err)
				}
			}

			// pvc as volume
			volumes = append(volumes, coreV1.Volume{
				Name: volName,
				VolumeSource: coreV1.VolumeSource{
					PersistentVolumeClaim: &coreV1.PersistentVolumeClaimVolumeSource{
						ClaimName: pvcName,
					},
				},
			})
		} else {
			return fmt.Errorf("unknown disk type: %s", disk.Type)
		}

		volumeMounts = append(volumeMounts, coreV1.VolumeMount{
			Name:      volName,
			MountPath: disk.Path,
		})
	}

	template.Spec.Volumes = volumes

	mainContainer := &template.Spec.Containers[0]
	mainContainer.VolumeMounts = volumeMounts

	return nil
}

// 2. diff ns pv reuse, remove old pvc, clean ref in pv
func (r *ComponentReconcilerTask) reconcilePVForReUse(ctx context.Context, pvc coreV1.PersistentVolumeClaim, pvName string) error {
	// 1. same ns pv reuse, pvc name should be same
	if pvc.Spec.VolumeName == pvName {
		return nil
	}

	var pv coreV1.PersistentVolume
	if err := r.Get(ctx, types.NamespacedName{Name: pvName}, &pv); err != nil {
		return err
	}

	// find which pvc is bound to this pv

	if pv.Spec.ClaimRef == nil {
		// pv is not bound, ready to be re-used
		return nil
	}

	ownerNs := pv.Spec.ClaimRef.Namespace
	ownerName := pv.Spec.ClaimRef.Name

	var ownerPVC coreV1.PersistentVolumeClaim
	err := r.Get(ctx, types.NamespacedName{Name: ownerName, Namespace: ownerNs}, &ownerPVC)
	if err != nil {
		if errors.IsNotFound(err) {
			// clean claimRef for this pv
			pv.Spec.ClaimRef = nil
			if err := r.Update(ctx, &pv); err != nil {
				return nil
			}
		} else {
			return err
		}
	} else {
		if pv.Spec.PersistentVolumeReclaimPolicy != coreV1.PersistentVolumeReclaimRetain {
			// pvc not safe to delete, nothing we can do but warning the user
			r.WarningEvent(
				fmt.Errorf("cannotBoundPV"),
				fmt.Sprintf("pv(%s) is bound by pvc(%s/%s), and reclaimPolicy is: %s",
					pv.Name, ownerPVC.Namespace, ownerPVC.Name, pv.Spec.PersistentVolumeReclaimPolicy,
				),
			)
		} else {
			// check if ownerPVC is being used
			if isInUse, err := r.pvcIsInUsed(ctx, ownerPVC); err != nil {
				return err
			} else if isInUse {
				// pvc in use, nothing we can do but warning the user
				r.WarningEvent(
					fmt.Errorf("cannotBoundPV"),
					fmt.Sprintf("pv(%s)'s bound pvc(%s/%s) is in use",
						pv.Name, ownerPVC.Namespace, ownerPVC.Name,
					),
				)
			} else {
				// delete ownerPVC
				if err := r.Delete(ctx, &ownerPVC); err != nil {
					return err
				}

				// clean claimRef on PV
				pv.Spec.ClaimRef = nil
				if err := r.Update(ctx, &pv); err != nil {
					return nil
				}
			}
		}
	}

	return nil
}

func (r *ComponentReconcilerTask) pvcIsInUsed(ctx context.Context, pvc coreV1.PersistentVolumeClaim) (bool, error) {
	var podList coreV1.PodList
	err := r.List(ctx, &podList, client.InNamespace(pvc.Namespace))
	if errors.IsNotFound(err) {
		return false, err
	}

	isInUse := false
	for _, pod := range podList.Items {
		for _, vol := range pod.Spec.Volumes {
			if vol.PersistentVolumeClaim == nil {
				continue
			}

			if vol.PersistentVolumeClaim.ClaimName == pvc.Name {
				isInUse = true
				break
			}
		}

		if isInUse {
			break
		}
	}

	return isInUse, nil
}
