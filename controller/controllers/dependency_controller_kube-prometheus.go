package controllers

import (
	"context"
	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
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
		r.UpdateStatus(ctx, d, corev1alpha1.DependencyStatusInstalling)
		return retryLaterErr
	case InstallFailed:
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

	ingPlugins := genIngressPluginsIfExist(config)
	ing, exist, err := r.getIngress(ctx, d, ingPlugins)
	if err != nil {
		return err
	}

	if !exist {
		if err := r.Create(ctx, ing); err != nil {
			return err
		}
	} else {
		if err := r.Update(ctx, ing); err != nil {
			return err
		}
	}

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
