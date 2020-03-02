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
	"github.com/go-logr/logr"
	"github.com/jetstack/cert-manager/pkg/apis/acme/v1alpha2"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/api/extensions/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/source"

	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"

	cmmeta "github.com/jetstack/cert-manager/pkg/apis/meta/v1"
)

// DependencyReconciler reconciles a Dependency object
type DependencyReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=core.kapp.dev,resources=dependencies,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kapp.dev,resources=dependencies/status,verbs=get;update;patch
// +kubebuilder:rbac:groups="",resources=secrets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="cert-manager.io",resources=clusterissuers,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="extensions",resources=ingresses,verbs=get;list;watch;create;update;patch;delete

func (r *DependencyReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("dependency", req.NamespacedName)

	// your logic here
	log.Info("reconciling dep")

	dep := corev1alpha1.Dependency{}
	fmt.Println("aaaaaaaaaaaaa")
	if err := r.Get(ctx, req.NamespacedName, &dep); err != nil {
		fmt.Println("err:", err)

		switch t := err.(type) {
		default:
			fmt.Println("type of err", fmt.Sprintf("%+v", t))
		}

		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	fmt.Println("bbbbbbbbbb")
	fmt.Printf("dep: %+v", dep)

	switch dep.Spec.Type {
	case "kong":
		if err := r.reconcileKong(ctx, &dep); err != nil {
			return ctrl.Result{}, err
		}
	default:
		return ctrl.Result{}, fmt.Errorf("unkonwn dependency: %s", dep.Spec.Type)
	}

	return ctrl.Result{}, nil
}

func (r *DependencyReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Dependency{}).
		//Owns(&cmv1alpha2.ClusterIssuer{}).
		Watches(
			&source.Kind{Type: &corev1alpha1.Application{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: handler.ToRequestsFunc(func(obj handler.MapObject) []ctrl.Request {
					var list corev1alpha1.DependencyList
					if err := r.List(context.TODO(), &list); err != nil {
						return nil
					}

					res := make([]ctrl.Request, len(list.Items))
					for i, dep := range list.Items {
						res[i].Name = dep.Name
						res[i].Namespace = dep.Namespace
					}

					r.Log.Info("watch applications", "enqueue reqs", len(res), "reqs", res)

					return res
				}),
			},
		).
		Complete(r)
}

// 1. check if dependency is installed
// 2. collect components info and update kong config
func (r *DependencyReconciler) reconcileKong(ctx context.Context, dep *corev1alpha1.Dependency) error {
	isInstalled, err := r.isKongControllerInstalled()
	if err != nil {
		return err
	}

	if !isInstalled {
		return r.UpdateStatus(ctx, dep, corev1alpha1.DependencyStatusNotInstalled)
	}

	// check if ClusterIssuer is ok
	if dep.Spec.Config != nil {
		err := r.reconcileClusterIssuer(ctx, dep)
		if err != nil {
			return err
		}
	}

	// check if Ingress for Kong is ok

	var kappList corev1alpha1.ApplicationList
	if err := r.List(ctx, &kappList, client.InNamespace("")); err != nil {
		return nil
	}

	r.Log.Info("kapps", "size:", len(kappList.Items))
	// collect ingress info & update kong

	ns2ingPluginsMap := make(map[string][]*corev1alpha1.PluginIngress)
	for _, kapp := range kappList.Items {
		ns := kapp.Namespace

		if existPlugins, exist := ns2ingPluginsMap[ns]; !exist {
			ns2ingPluginsMap[ns] = GetIngressPlugins(&kapp)
		} else {
			ns2ingPluginsMap[ns] = append(existPlugins, GetIngressPlugins(&kapp)...)
		}
	}

	r.Log.Info("ns2ingPluginsMap", "size:", len(ns2ingPluginsMap))

	for ns, ingPlugins := range ns2ingPluginsMap {
		if len(ingPlugins) <= 0 {
			continue
		}

		r.Log.Info("plugins",
			"ns", ns,
			"size:", len(ingPlugins),
			"ingPlugins", ingPlugins)

		ing, exist, err := r.getIngress(ctx, dep, ingPlugins)
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
	}

	return r.UpdateStatus(ctx, dep, corev1alpha1.DependencyStatusRunning)
}

func (r *DependencyReconciler) isKongControllerInstalled() (bool, error) {
	//todo
	return true, nil
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
		rules = append(rules, GenRulesOfIngressPlugin(ingPlugin)...)

		hosts = append(hosts, ingPlugin.Hosts...)
	}

	// ref: https://github.com/Kong/kubernetes-ingress-controller/blob/master/docs/guides/cert-manager.md#request-tls-certificate-from-lets-encrypt
	ing := v1beta1.Ingress{
		TypeMeta: v1.TypeMeta{APIVersion: v1beta1.SchemeGroupVersion.String(), Kind: "Ingress"},
		ObjectMeta: v1.ObjectMeta{
			Name:      dep.Name,
			Namespace: ns,
			Annotations: map[string]string{
				"kubernetes.io/tls-acme":         "true",
				"cert-manager.io/cluster-issuer": getNameForClusterIssuer(dep),
			},
		},
		Spec: v1beta1.IngressSpec{
			//Backend: &v1beta1.IngressBackend{
			//	ServiceName: "",
			//	ServicePort: intstr.IntOrString{},
			//},
			TLS: []v1beta1.IngressTLS{
				{
					Hosts: hosts,
					//todo can not set ns here?
					SecretName: getSecNameForClusterIssuer(dep),
				},
			},
			Rules: rules,
		},
	}

	return ing
}

// can only handle two tlsType: selfsign & acme
func (r *DependencyReconciler) reconcileClusterIssuer(ctx context.Context, dep *corev1alpha1.Dependency) error {
	config := dep.Spec.Config

	switch config["tlsType"] {
	case "selfSigned":
		//todo
		return fmt.Errorf("tlsType not supported yet: selfSigned")

	case "acme":
		provider := config["challengeProvider"]
		if provider != "cloudflare" {
			return fmt.Errorf("acme provider not supported yet: %s", provider)
		}

		email := config["challengeEmail"]
		plainSecret := config["challengeSecret"]

		secKey := "sec-content"

		sec := corev1.Secret{}
		if err := r.Get(ctx, types.NamespacedName{
			Namespace: "cert-manager",
			Name:      getSecNameForClusterIssuer(dep),
		}, &sec); err != nil {
			if !errors.IsNotFound(err) {
				return err
			}

			sec := corev1.Secret{
				TypeMeta: v1.TypeMeta{
					APIVersion: corev1.SchemeGroupVersion.String(),
					Kind:       "Secret",
				},
				ObjectMeta: v1.ObjectMeta{
					Namespace: "cert-manager",
					Name:      getSecNameForClusterIssuer(dep),
				},
				StringData: map[string]string{
					secKey: plainSecret,
				},
				Type: "Opaque",
			}

			if err := ctrl.SetControllerReference(dep, &sec, r.Scheme); err != nil {
				return err
			}

			if err := r.Create(ctx, &sec); err != nil {
				return err
			}
		}
		// todo update

		// ref: https://cert-manager.io/docs/configuration/acme/dns01/cloudflare/
		clusterIssuer := cmv1alpha2.ClusterIssuer{}
		if err := r.Get(ctx, client.ObjectKey{Name: getNameForClusterIssuer(dep)}, &clusterIssuer); err != nil {
			if !errors.IsNotFound(err) {
				return err
			}

			clusterIssuer := cmv1alpha2.ClusterIssuer{
				TypeMeta: v1.TypeMeta{
					APIVersion: cmv1alpha2.SchemeGroupVersion.String(),
					Kind:       "ClusterIssuer",
				},
				ObjectMeta: v1.ObjectMeta{
					//Namespace: "cert-manager", //?
					Name: getNameForClusterIssuer(dep),
				},
				Spec: cmv1alpha2.IssuerSpec{
					IssuerConfig: cmv1alpha2.IssuerConfig{
						ACME: &v1alpha2.ACMEIssuer{
							Email: email,
							//Server: "https://acme-staging-v02.api.letsencrypt.org/directory",
							Server: "https://acme-v02.api.letsencrypt.org/directory",
							PrivateKey: cmmeta.SecretKeySelector{
								LocalObjectReference: cmmeta.LocalObjectReference{
									Name: getPrvKeyNameForClusterIssuer(dep),
								},
								//Key: secKey,
							},
							Solvers: []v1alpha2.ACMEChallengeSolver{
								{
									DNS01: &v1alpha2.ACMEChallengeSolverDNS01{
										Cloudflare: &v1alpha2.ACMEIssuerDNS01ProviderCloudflare{
											Email: email,
											APIKey: &cmmeta.SecretKeySelector{
												LocalObjectReference: cmmeta.LocalObjectReference{
													Name: getSecNameForClusterIssuer(dep),
												},
												Key: secKey,
											},
										},
									},
								},
							},
						},
					},
				},
			}

			if err := ctrl.SetControllerReference(dep, &clusterIssuer, r.Scheme); err != nil {
				return err
			}

			r.Log.Info("creating clusterIssuer", "name", getNameForClusterIssuer(dep))
			if err := r.Create(ctx, &clusterIssuer); err != nil {
				r.Log.Error(err, "fail create clusterIssuer")
				return err
			}
		}
		// todo update

		return nil

	default:
		return fmt.Errorf("unknown tlsType: %s", config["tlsType"])
	}
}

func (r *DependencyReconciler) UpdateStatus(ctx context.Context, dep *corev1alpha1.Dependency, status string) error {
	dep.Status = corev1alpha1.DependencyStatus{
		Status: status,
	}

	if err := r.Status().Update(ctx, dep); err != nil {
		r.Log.Error(err, "fail to update status")
		return err
	}

	return nil
}

func getNameForClusterIssuer(dep *corev1alpha1.Dependency) string {
	tlsType := dep.Spec.Config["tlsType"]
	provider := dep.Spec.Config["challengeProvider"]
	return fmt.Sprintf("%s-%s-%s", dep.Name, tlsType, provider)
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
