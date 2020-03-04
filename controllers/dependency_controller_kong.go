package controllers

import (
	"context"
	"fmt"
	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/jetstack/cert-manager/pkg/apis/acme/v1alpha2"
	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	cmmeta "github.com/jetstack/cert-manager/pkg/apis/meta/v1"
	"io/ioutil"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/api/extensions/v1beta1"
	apiextv1beta1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/apimachinery/pkg/types"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"log"
	"regexp"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strings"
)

var retryLaterErr = fmt.Errorf("retry later")

func isRetryLaterErr(err error) bool {
	return err == retryLaterErr
}

func returnRstForError(err error) (ctrl.Result, error) {
	if errors.IsNotFound(err) {
		return ctrl.Result{}, nil
	} else if isRetryLaterErr(err) {
		return ctrl.Result{Requeue: true}, nil
	} else {
		return ctrl.Result{}, err
	}
}

// 1. check if dependency is installed
// 2. collect components info and update kong config
func (r *DependencyReconciler) reconcileKong(ctx context.Context, dep *corev1alpha1.Dependency) error {
	status, err := r.getKongIngressControllerInstallStatus()
	if err != nil {
		return err
	}

	r.Log.Info("kong-ingress-controller install status", "status", status)

	switch status {
	case NotInstalled:
		// try install
		if err := r.UpdateStatus(ctx, dep, corev1alpha1.DependencyStatusInstalling); err != nil {
			return err
		}

		// try installing kong first
		if err := r.reconcileKongIngressController(ctx); err != nil {
			return err
		}

		return retryLaterErr
	case Installing:
		// wait
		r.UpdateStatus(ctx, dep, corev1alpha1.DependencyStatusInstalling)
		return retryLaterErr
	case InstallFailed:
		// failed, nothing can be done
		if err := r.UpdateStatus(ctx, dep, corev1alpha1.DependencyStatusInstallFailed); err != nil {
			return err
		}
		return nil
	case Installed:
		r.Log.Info("kong-ingress-controller installed")
		// go on to do more
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

type KongIngressControllerInstallStatus int

const (
	NotInstalled = iota
	Installing
	InstallFailed
	Installed
)

func (r *DependencyReconciler) getKongIngressControllerInstallStatus() (KongIngressControllerInstallStatus, error) {
	// check if dp exist in ns: kapp-kong
	dpList := appsv1.DeploymentList{}
	if err := r.List(context.TODO(), &dpList, client.InNamespace("kapp-kong")); err != nil {
		return 0, err
	}

	for _, dp := range dpList.Items {
		if dp.Name != "ingress-kong" {
			continue
		}

		if len(dp.Status.Conditions) <= 0 {
			return Installing, nil
		}

		// todo first or last?
		latestCondition := dp.Status.Conditions[0]

		// todo latestCondition.Status also matters?
		switch latestCondition.Type {
		case appsv1.DeploymentAvailable:
			return Installed, nil
		case appsv1.DeploymentProgressing:
			return Installing, nil
		case appsv1.DeploymentReplicaFailure:
			return InstallFailed, nil
		}
	}

	return NotInstalled, nil
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

// ref: https://github.com/kubernetes/client-go/issues/193#issuecomment-363318588
func parseK8sYaml(fileR []byte) []runtime.Object {

	acceptedK8sTypes := regexp.MustCompile(`(CustomResourceDefinition|ConfigMap|Service|Deployment|Namespace|Role|ClusterRole|RoleBinding|ClusterRoleBinding|ServiceAccount)`)
	fileAsString := string(fileR[:])
	sepYamlFiles := strings.Split(fileAsString, "---")
	retVal := make([]runtime.Object, 0, len(sepYamlFiles))
	for _, f := range sepYamlFiles {
		if f == "\n" || f == "" {
			// ignore empty cases
			continue
		}

		// todo
		sch := runtime.NewScheme()
		_ = clientgoscheme.AddToScheme(sch)
		_ = corev1alpha1.AddToScheme(sch)
		_ = cmv1alpha2.AddToScheme(sch)
		_ = apiextv1beta1.AddToScheme(sch)

		decode := serializer.NewCodecFactory(sch).UniversalDeserializer().Decode
		obj, groupVersionKind, err := decode([]byte(f), nil, nil)

		if err != nil {
			log.Println(fmt.Sprintf("Error while decoding YAML object. Err was: %s", err))
			continue
		}

		if !acceptedK8sTypes.MatchString(groupVersionKind.Kind) {
			log.Printf("The custom-roles configMap contained K8s object types which are not supported! Skipping object with type: %s", groupVersionKind.Kind)
		} else {
			retVal = append(retVal, obj)
		}
	}

	return retVal
}

func (r *DependencyReconciler) createMany(ctx context.Context, objs ...runtime.Object) error {
	for _, obj := range objs {
		if err := r.Create(ctx, obj); err != nil {
			return err
		}
	}

	return nil
}

func (r *DependencyReconciler) reconcileKongIngressController(ctx context.Context) error {
	//load yaml for kong-controller
	file := loadFile("kong_1.0.0.yaml")
	objs := parseK8sYaml(file)

	// only create, no update yet
	return r.createMany(ctx, objs...)
}

func loadFile(fileName string) []byte {
	// todo more search paths
	dat, err := ioutil.ReadFile(fmt.Sprintf("./resources/%s", fileName))
	if err != nil {
		fmt.Println("err loadFile:", err)
		return nil
	}

	return dat
}
