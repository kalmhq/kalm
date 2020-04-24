package controllers

import (
	"context"
	"fmt"
	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	"k8s.io/api/extensions/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var retryLaterErr = fmt.Errorf("retry later")

func isRetryLaterErr(err error) bool {
	return err == retryLaterErr
}

func returnRstForError(err error) (ctrl.Result, error) {
	if errors.IsNotFound(err) {
		return ctrl.Result{}, nil
	} else if isRetryLaterErr(err) {
		fmt.Println("returnRstForError retryLater")
		return ctrl.Result{Requeue: true}, nil
	} else {
		return ctrl.Result{}, err
	}
}

// 1. check if dependency is installed
// 2. collect components info and update kong config
func (r *DependencyReconciler) reconcileKong(ctx context.Context, dep *corev1alpha1.Dependency) error {
	status, err := r.getDependencyInstallStatus("kapp-kong", []string{"ingress-controller", "proxy"}, nil)
	if err != nil {
		return err
	}

	r.Log.Info("dep kong install status",
		"status", status)

	switch status {
	case NotInstalled:
		// try installing kong first
		if err := r.reconcileExternalController(ctx, dep, "kong_1.0.0.yaml"); err != nil {
			return err
		}

		return retryLaterErr
	case Installing:
		// wait
		r.UpdateStatusIfNotMatch(ctx, dep, corev1alpha1.DependencyStatusInstalling)
		return retryLaterErr
	case InstallFailed:
		// failed, nothing can be done
		if err := r.UpdateStatusIfNotMatch(ctx, dep, corev1alpha1.DependencyStatusInstallFailed); err != nil {
			return err
		}
		return nil
	case Installed:
		r.Log.Info("kong-ingress-controller installed")
		// go on to do more
	}

	//// check if ClusterIssuer is ok
	//if dep.Spec.Config != nil {
	//	err := r.reconcileClusterIssuer(ctx, dep)
	//	if err != nil {
	//		return err
	//	}
	//}

	// check if Ingress for Kong is ok

	var kappList corev1alpha1.ApplicationList
	if err := r.List(ctx, &kappList, client.InNamespace("")); err != nil {
		return nil
	}

	r.Log.Info("kapps", "size:", len(kappList.Items))
	// collect ingress info & update kong

	//ns2ingPluginsMap := make(map[string][]*corev1alpha1.PluginIngress)
	//for _, kapp := range kappList.Items {
	//	ns := kapp.Namespace
	//
	//	if existPlugins, exist := ns2ingPluginsMap[ns]; !exist {
	//		ns2ingPluginsMap[ns] = GetIngressPlugins(&kapp)
	//	} else {
	//		ns2ingPluginsMap[ns] = append(existPlugins, GetIngressPlugins(&kapp)...)
	//	}
	//}

	//r.Log.Info("ns2ingPluginsMap", "size:", len(ns2ingPluginsMap))

	// 1 ingress per namespace
	//for ns, ingPlugins := range ns2ingPluginsMap {
	//	if len(ingPlugins) <= 0 {
	//		continue
	//	}
	//
	//	r.Log.Info("plugins",
	//		"ns", ns,
	//		"size:", len(ingPlugins),
	//		"ingPlugins", ingPlugins)
	//
	//	ing, exist, err := r.getIngress(ctx, dep, ingPlugins)
	//	if err != nil {
	//		return err
	//	}
	//
	//	if !exist {
	//		r.Log.Info("creating ing")
	//		if err := r.Create(ctx, ing); err != nil {
	//			return err
	//		}
	//	} else {
	//		r.Log.Info("updating ing")
	//		if err := r.Update(ctx, ing); err != nil {
	//			return err
	//		}
	//	}

	//}

	return r.UpdateStatusIfNotMatch(ctx, dep, corev1alpha1.DependencyStatusRunning)
}

func (r *DependencyReconciler) getIngress(
	ctx context.Context,
	dep *corev1alpha1.Dependency,
	ingPlugins []*corev1alpha1.PluginIngress,
) (*v1beta1.Ingress, bool, error) {

	ns := ingPlugins[0].Namespace

	desiredIng := r.desiredIngress(dep, ingPlugins)

	ing := v1beta1.Ingress{}
	if err := r.Get(ctx, types.NamespacedName{Namespace: ns, Name: dep.Name}, &ing); err != nil {
		if !errors.IsNotFound(err) {
			return nil, false, err
		}

		ing := desiredIng
		ctrl.SetControllerReference(dep, &ing, r.Scheme)

		return &ing, false, nil
	}

	// make sure config matches
	ing.Spec.Rules = desiredIng.Spec.Rules
	ing.Spec.TLS = desiredIng.Spec.TLS
	ing.Annotations = desiredIng.Annotations

	return &ing, true, nil
}

func (r *DependencyReconciler) desiredIngress(
	dep *corev1alpha1.Dependency,
	ingPlugins []*corev1alpha1.PluginIngress,
) v1beta1.Ingress {

	ns := ingPlugins[0].Namespace

	var rules []v1beta1.IngressRule
	var hosts []string
	for _, ingPlugin := range ingPlugins {
		//rules = append(rules, GenRulesOfIngressPlugin(ingPlugin)...)

		hosts = append(hosts, ingPlugin.Hosts...)
	}

	// ref: https://github.com/Kong/kubernetes-ingress-controller/blob/master/docs/guides/cert-manager.md#request-tls-certificate-from-lets-encrypt
	ing := v1beta1.Ingress{
		TypeMeta: v1.TypeMeta{APIVersion: v1beta1.SchemeGroupVersion.String(), Kind: "Ingress"},
		ObjectMeta: v1.ObjectMeta{
			Name:      dep.Name,
			Namespace: ns,
			Annotations: map[string]string{
				"kubernetes.io/ingress.class": "kong",
			},
		},
		Spec: v1beta1.IngressSpec{
			Rules: rules,
		},
	}

	if cmName, exist := dep.Spec.Config["cert-manager"]; exist {
		ing.Spec.TLS = []v1beta1.IngressTLS{
			{
				Hosts: hosts,
				//todo can not set ns here?
				// todo should delete this secret if ing deleted
				SecretName: "this-sec-name-does-not-matter-" + cmName,
			},
		}

		if ing.Annotations == nil {
			ing.Annotations = make(map[string]string)
		}

		ing.Annotations["kubernetes.io/tls-acme"] = "true"
		ing.Annotations["cert-manager.io/cluster-issuer"] = cmName
	}

	return ing
}

func getPrvKeyNameForClusterIssuer(dep *corev1alpha1.Dependency) string {
	tlsType := dep.Spec.Config["tlsType"]
	provider := dep.Spec.Config["challengeProvider"]
	return fmt.Sprintf("prvkey-%s-%s-%s", dep.Name, tlsType, provider)
}

func getSecNameForClusterIssuer(dep *corev1alpha1.Dependency) string {
	tlsType := dep.Spec.Config["tlsType"]
	provider := dep.Spec.Config["challengeProvider"]
	return fmt.Sprintf("sec-%s-%s-%s", dep.Name, tlsType, provider)
}
