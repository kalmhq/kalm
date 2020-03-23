package controllers

import (
	"context"
	"fmt"
	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/jetstack/cert-manager/pkg/apis/acme/v1alpha2"
	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	cmmetav1 "github.com/jetstack/cert-manager/pkg/apis/meta/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *DependencyReconciler) reconcileCertManager(ctx context.Context, dep *corev1alpha1.Dependency) error {
	// check if cert-manger installed
	status, err := r.getDependencyInstallStatus("cert-manager",
		[]string{"cert-manager", "cert-manager-webhook", "cert-manager-cainjector"},
		nil)
	if err != nil {
		return err
	}

	r.Log.Info("cert-manager install status",
		"status", status)

	switch status {
	case NotInstalled:
		//if err := r.UpdateStatusIfNotMatch(ctx, dep, corev1alpha1.DependencyStatusInstalling); err != nil {
		//	return err
		//}

		// try installing first
		if err := r.reconcileExternalController(ctx, "cert-manager-1.0.0.yaml"); err != nil {
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
		r.Log.Info("cert-manager installed")
		//r.UpdateStatusIfNotMatch(ctx, dep, corev1alpha1.DependencyStatusInstalled)
		// go on to do more
	}

	// check if config for ClusterIssuer is provided
	if dep.Spec.Config == nil {
		r.Log.Error(fmt.Errorf("must porvide config for cert-manager"), "")
		return nil
	}

	r.Log.Info("cert-m detail", "dep", dep)

	return r.reconcileClusterIssuer(ctx, dep)
}

// support only one tlsType: acme
// todo support selfsign for local test
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

			r.Log.Info("secret created")
		}
		// todo update

		// ref: https://cert-manager.io/docs/configuration/acme/dns01/cloudflare/
		clusterIssuer := cmv1alpha2.ClusterIssuer{}
		if err := r.Get(ctx, client.ObjectKey{Name: dep.Name}, &clusterIssuer); err != nil {
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
					Name: dep.Name,
				},
				Spec: cmv1alpha2.IssuerSpec{
					IssuerConfig: cmv1alpha2.IssuerConfig{
						ACME: &v1alpha2.ACMEIssuer{
							Email: email,
							//Server: "https://acme-staging-v02.api.letsencrypt.org/directory",
							Server: "https://acme-v02.api.letsencrypt.org/directory",
							PrivateKey: cmmetav1.SecretKeySelector{
								LocalObjectReference: cmmetav1.LocalObjectReference{
									Name: getPrvKeyNameForClusterIssuer(dep),
								},
								//Key: secKey,
							},
							Solvers: []v1alpha2.ACMEChallengeSolver{
								{
									DNS01: &v1alpha2.ACMEChallengeSolverDNS01{
										Cloudflare: &v1alpha2.ACMEIssuerDNS01ProviderCloudflare{
											Email: email,
											APIKey: &cmmetav1.SecretKeySelector{
												LocalObjectReference: cmmetav1.LocalObjectReference{
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

			r.Log.Info("creating clusterIssuer", "name", dep.Name)
			if err := r.Create(ctx, &clusterIssuer); err != nil {
				r.Log.Error(err, "fail create clusterIssuer")
				return err
			}
		}

		// todo update

		return r.UpdateStatusIfNotMatch(ctx, dep, corev1alpha1.DependencyStatusRunning)

	default:
		return fmt.Errorf("unknown tlsType: %s", config["tlsType"])
	}
}
