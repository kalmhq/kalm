package controllers

import (
	"context"
	"fmt"
	"strings"

	"github.com/go-logr/logr"
	coreV1Alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	installV1Alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"
	"istio.io/api/security/v1beta1"
	v1beta13 "istio.io/api/type/v1beta1"
	v1beta12 "istio.io/client-go/pkg/apis/security/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func getKalmDashboardVersion(config *installV1Alpha1.KalmOperatorConfig) string {
	if config.Spec.Dashboard != nil {
		if config.Spec.Dashboard.Version != "" {
			return config.Spec.Dashboard.Version
		}
	}

	if config.Spec.Version != "" {
		return config.Spec.Version
	}

	if config.Spec.KalmVersion != "" {
		return config.Spec.KalmVersion
	}

	return "latest"
}

func getKalmDashboardCommand(config *installV1Alpha1.KalmOperatorConfig) string {
	var sb strings.Builder
	sb.WriteString("./kalm-api-server")

	if config.Spec.Dashboard != nil {
		for _, item := range config.Spec.Dashboard.Args {
			sb.WriteString(" ")
			sb.WriteString(item)
		}
	}

	return sb.String()
}

func getKalmDashboardEnvs(config *installV1Alpha1.KalmOperatorConfig) []coreV1Alpha1.EnvVar {
	var envs []coreV1Alpha1.EnvVar
	if config.Spec.Dashboard != nil {
		for _, nv := range config.Spec.Dashboard.Envs {
			envs = append(envs, coreV1Alpha1.EnvVar{
				Name:  nv.Name,
				Value: nv.Value,
				Type:  coreV1Alpha1.EnvVarTypeStatic,
			})
		}
	}
	return envs
}

func (r *KalmOperatorConfigReconciler) reconcileKalmDashboard(config *installV1Alpha1.KalmOperatorConfig, ctx context.Context, log logr.Logger) error {
	dashboardName := "kalm"
	dashboard := coreV1Alpha1.Component{}

	if config.Spec.SkipKalmDashboardInstallation {
		err := r.Get(ctx, types.NamespacedName{Name: dashboardName, Namespace: NamespaceKalmSystem}, &dashboard)

		if errors.IsNotFound(err) {
			return nil
		}

		return r.Delete(context.Background(), &dashboard)
	}

	dashboardVersion := getKalmDashboardVersion(config)
	command := getKalmDashboardCommand(config)
	envs := getKalmDashboardEnvs(config)

	expectedDashboard := coreV1Alpha1.Component{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: NamespaceKalmSystem,
			Name:      dashboardName,
		},
		Spec: coreV1Alpha1.ComponentSpec{
			Image:   fmt.Sprintf("%s:%s", KalmDashboardImgRepo, dashboardVersion),
			Command: command,
			Env:     envs,
			Ports: []coreV1Alpha1.Port{
				{
					Protocol:      coreV1Alpha1.PortProtocolHTTP2,
					ContainerPort: 3001,
					ServicePort:   80,
				},
			},
		},
	}

	err := r.Get(ctx, types.NamespacedName{Name: dashboardName, Namespace: NamespaceKalmSystem}, &dashboard)

	if err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		if err := r.Client.Create(ctx, &expectedDashboard); err != nil {
			return err
		}
	} else {
		dashboard.Spec = expectedDashboard.Spec
		r.Log.Info("updating dashboard component in kalm-system")

		if err := r.Client.Update(ctx, &dashboard); err != nil {
			r.Log.Error(err, "fail updating dashboard component in kalm-system")
			return err
		}
	}

	// Create policy, only allow traffic from istio-ingressgateway to reach kalm api/dashboard
	policy := &v1beta12.AuthorizationPolicy{
		ObjectMeta: metaV1.ObjectMeta{
			Namespace: NamespaceKalmSystem,
			Name:      dashboardName,
		},
		Spec: v1beta1.AuthorizationPolicy{
			Selector: &v1beta13.WorkloadSelector{
				MatchLabels: map[string]string{
					"app": dashboardName,
				},
			},
			Action: v1beta1.AuthorizationPolicy_ALLOW,
			Rules: []*v1beta1.Rule{
				{
					When: []*v1beta1.Condition{
						{
							Key: "source.namespace",
							Values: []string{
								"istio-system",
							},
						},
					},
				},
			},
		},
	}

	var fetchedPolicy v1beta12.AuthorizationPolicy
	err = r.Get(ctx, types.NamespacedName{Name: policy.Name, Namespace: policy.Namespace}, &fetchedPolicy)
	if err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		if err := r.Client.Create(ctx, policy); err != nil {
			return err
		}
	} else {
		dashboard.Spec = expectedDashboard.Spec
		copied := fetchedPolicy.DeepCopy()
		copied.Spec = policy.Spec

		if err := r.Client.Patch(ctx, copied, client.MergeFrom(&fetchedPolicy)); err != nil {
			return err
		}
	}

	return nil
}
