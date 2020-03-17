package controllers

import (
	"context"
	monitoringv1 "github.com/coreos/prometheus-operator/pkg/apis/monitoring/v1"
	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
)

func (r *DependencyReconciler) reconcileKubePrometheus(ctx context.Context, d *corev1alpha1.Dependency) error {
	operatorStatus, err := r.getDependencyInstallStatus("kapp-monitoring", "prometheus-operator")
	if err != nil {
		return err
	}

	switch operatorStatus {
	case NotInstalled:
		if err := r.UpdateStatus(ctx, d, corev1alpha1.DependencyStatusInstalling); err != nil {
			return err
		}

		// try install Prometheus Operator
		if err := r.reconcileExternalController(ctx, "/kube-prometheus/setup"); err != nil {
			return err
		}

		return retryLaterErr
	case Installing:
		r.UpdateStatus(ctx, d, corev1alpha1.DependencyStatusInstalling)
		return retryLaterErr
	case InstallFailed:
		r.UpdateStatus(ctx, d, corev1alpha1.DependencyStatusInstallFailed)
		return nil
	case Installed:
		r.Log.Info("prometheus operator installed")
	}

	// other parts
	otherParts := []string{
		"grafana",
		"kube-state-metrics",
		"prometheus-adapter",
	}
	otherPartsStatus, err := r.getDependencyInstallStatus("kapp-monitoring", otherParts...)
	if err != nil {
		return err
	}
	switch otherPartsStatus {
	case NotInstalled:
		r.Log.Info("prometheus operator otherParts not installed")

		if err := r.UpdateStatus(ctx, d, corev1alpha1.DependencyStatusInstalling); err != nil {
			return err
		}

		// try install remaining parts, including
		// grafana
		// prome-adapter
		// kube-state-metrics
		//
		// alertmanager
		// prometheus-k8s(?)
		//
		// node-exporter

		if err := r.reconcileExternalController(ctx, "/kube-prometheus"); err != nil {
			return err
		}

		return retryLaterErr
	case Installing:
		r.Log.Info("prometheus operator otherParts installing")
		r.UpdateStatus(ctx, d, corev1alpha1.DependencyStatusInstalling)
		return retryLaterErr
	case InstallFailed:
		r.Log.Info("prometheus operator otherParts install failed")
		r.UpdateStatus(ctx, d, corev1alpha1.DependencyStatusInstallFailed)
		return nil
	case Installed:
		r.Log.Info("prometheus other parts installed too")
	}

	// check config
	config := d.Spec.Config
	if config == nil {
		return nil
	}

	// config pv
	var pvSize string
	if v, exist := config["persistenVolumeSize"]; !exist || v == "" {
		// default size, for dev
		pvSize = "128Mi"
	} else {
		// todo check if valid
		pvSize = v
	}

	prometheus := monitoringv1.Prometheus{}
	err = r.Get(ctx, types.NamespacedName{Namespace: "kapp-monitoring", Name: "k8s"}, &prometheus)
	if err != nil {
		if errors.IsNotFound(err) {
			return retryLaterErr
		}

		return err
	}

	// todo also update if size don't match
	if prometheus.Spec.Storage == nil {
		pvc := corev1.PersistentVolumeClaim{
			ObjectMeta: metav1.ObjectMeta{
				Name:              prometheus.Name,
				Namespace:         prometheus.Namespace,
				CreationTimestamp: metav1.Now(),
			},
			Spec: corev1.PersistentVolumeClaimSpec{
				AccessModes: []corev1.PersistentVolumeAccessMode{corev1.ReadWriteOnce},
				Resources: corev1.ResourceRequirements{
					Requests: corev1.ResourceList{
						corev1.ResourceStorage: resource.MustParse(pvSize),
					},
				},
				StorageClassName: nil,
			},
		}

		prometheus.Spec.Storage = &monitoringv1.StorageSpec{
			VolumeClaimTemplate: pvc,
		}

		if err := r.Update(ctx, &prometheus); err != nil {
			r.Log.Error(err, "fail to update prometheus pv")
			return err
		}
	}

	ingPlugins := genIngressPluginsIfExist(config)
	ing, exist, err := r.getIngress(ctx, d, ingPlugins)
	if err != nil {
		return err
	}

	if !exist {
		if err := ctrl.SetControllerReference(d, ing, r.Scheme); err != nil {
			return err
		}

		if err := r.Create(ctx, ing); err != nil {
			return err
		}
	} else {
		if err := r.Update(ctx, ing); err != nil {
			return err
		}
	}

	//todo what to do if dep is deleted? delete all prometheus infra?

	return nil
}

const (
	kubePromethuesNS = "kapp-monitoring"
	pluginIngress    = "plugins.core.kapp.dev/v1alpha1.ingress"
)

func genIngressPluginsIfExist(config map[string]string) (rst []*corev1alpha1.PluginIngress) {
	if gHost, exist := config["grafanaHost"]; exist {
		rst = append(rst, &corev1alpha1.PluginIngress{
			Name:        "grafana",
			Type:        pluginIngress,
			Hosts:       []string{gHost},
			Namespace:   kubePromethuesNS,
			ServiceName: "grafana",
			ServicePort: 3000,
		})
	}

	if pHost, exist := config["prometheusHost"]; exist {
		rst = append(rst, &corev1alpha1.PluginIngress{
			Name:        "prometheus",
			Type:        pluginIngress,
			Hosts:       []string{pHost},
			Namespace:   kubePromethuesNS,
			ServiceName: "prometheus-k8s",
			ServicePort: 9090,
		})
	}

	return
}
