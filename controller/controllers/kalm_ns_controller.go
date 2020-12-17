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
	"strconv"
	"strings"
	"time"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	istioapisec "istio.io/api/security/v1beta1"
	istiosec "istio.io/client-go/pkg/apis/security/v1beta1"
	v1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"

	ctrl "sigs.k8s.io/controller-runtime"
)

const (
	KalmEnableLabelName  = "kalm-enabled"
	KalmEnableLabelValue = "true"

	IstioInjectionLabelName        = "istio-injection"
	IstioInjectionLabelEnableValue = "enabled"
)

// KalmNSReconciler watches all namespaces
type KalmNSReconciler struct {
	*BaseReconciler
	ctx context.Context
}

func NewKalmNSReconciler(mgr ctrl.Manager) *KalmNSReconciler {
	return &KalmNSReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "KalmNS"),
		ctx:            context.Background(),
	}
}

// resource change needs trigger reconcile
type MapperForDefaultHttpsCertIssuer struct{}

func (m MapperForDefaultHttpsCertIssuer) Map(mapObj handler.MapObject) []reconcile.Request {
	return []reconcile.Request{{NamespacedName: types.NamespacedName{
		Namespace: mapObj.Meta.GetNamespace(),
		Name:      "default-httpscertissuer-" + mapObj.Meta.GetName(),
	}}}
}

func (r *KalmNSReconciler) SetupWithManager(mgr ctrl.Manager) error {

	return ctrl.NewControllerManagedBy(mgr).
		For(&v1.Namespace{}).
		Watches(genSourceForObject(&v1alpha1.HttpsCertIssuer{}), &handler.EnqueueRequestsFromMapFunc{
			ToRequests: MapperForDefaultHttpsCertIssuer{},
		}).
		Complete(r)
}

func genSourceForObject(obj runtime.Object) source.Source {
	return &source.Kind{Type: obj}
}

// +kubebuilder:rbac:groups="",resources=namespaces,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=metrics.k8s.io,resources=*,verbs=get;list;watch

func (r *KalmNSReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := r.ctx

	ns := v1.Namespace{}
	if err := r.Get(ctx, client.ObjectKey{Name: req.Name}, &ns); err != nil {
		if errors.IsNotFound(err) {
			return ctrl.Result{}, nil
		} else {
			return ctrl.Result{}, err
		}
	}

	if !ns.DeletionTimestamp.IsZero() {
		r.Log.Info("being deleting, ignored", "ns", ns.Name)
		return ctrl.Result{}, nil
	}

	tenant := ns.Labels[v1alpha1.TenantNameLabelKey]
	isKalmCtrlPlaneNS := ns.Labels[v1alpha1.KalmControlPlaneLabelKey]

	if isKalmCtrlPlaneNS == "true" ||
		tenant == v1alpha1.DefaultGlobalTenantName ||
		tenant == v1alpha1.DefaultSystemTenantName {

		// disable network isolation for kalm-ctrl-plane for now
		// if err := r.reconcileNetworkPoliciesForCtrlPlane(ns.Name); err != nil {
		// 	return ctrl.Result{}, err
		// }

	} else if tenant != "" {
		if err := r.reconcileNetworkPoliciesForTenant(ns.Name, tenant); err != nil {
			return ctrl.Result{}, err
		}
	} else {
		r.Log.Info("see ns neither tenant nor ctrl-plane", "ns", ns.Name)
	}

	if ns.Labels[KalmEnableLabelName] == "true" {
		if err := r.reconcileCommonConfigMap(ns.Name); err != nil {
			return ctrl.Result{}, err
		}

		if err := r.reconcileCommonSecret(ns.Name); err != nil {
			return ctrl.Result{}, err
		}
	}

	// todo weird logic to process all ns here
	var namespaceList v1.NamespaceList
	if err := r.List(ctx, &namespaceList, client.HasLabels([]string{KalmEnableLabelName})); err != nil {
		err = client.IgnoreNotFound(err)
		return ctrl.Result{}, err
	}

	now := time.Now()

	for _, ns := range namespaceList.Items {
		_, exist := ns.Labels[KalmEnableLabelName]
		if !exist {
			continue
		}

		if v, exist := ns.Labels[IstioInjectionLabelName]; !exist || v != IstioInjectionLabelEnableValue {
			deepCopiedNs := ns.DeepCopy()
			deepCopiedNs.Labels[IstioInjectionLabelName] = IstioInjectionLabelEnableValue
			if err := r.Update(ctx, deepCopiedNs); err != nil {
				return ctrl.Result{}, err
			}
		}

		var compList v1alpha1.ComponentList
		if err := r.List(ctx, &compList, client.InNamespace(ns.Name)); client.IgnoreNotFound(err) != nil {
			return ctrl.Result{}, err
		}

		isActive := IsNamespaceKalmEnabled(ns)

		for _, item := range compList.Items {
			component := item.DeepCopy()
			if component.Labels == nil {
				component.Labels = map[string]string{}
			}

			var suffix string
			if isActive {
				suffix = "enabled"
			} else {
				suffix = "disabled"
			}

			labelNSUpdatedAt := "kalm-namespace-updated-at"

			oldLabelVal := component.Labels[labelNSUpdatedAt]
			if !strings.HasSuffix(oldLabelVal, suffix) {
				component.Labels[labelNSUpdatedAt] = strconv.Itoa(int(now.Unix())) + "-" + suffix

				if err := r.Update(ctx, component); err != nil {
					return ctrl.Result{}, err
				}
			}
		}
	}

	// todo weird to process cert logic here

	// check if default caIssuer & cert is created
	if err := r.reconcileDefaultCAIssuerAndCert(); err != nil {
		return ctrl.Result{}, err
	}

	if err := r.reconcileDefaultHTTP01Issuer(); err != nil {
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

const authzPolicyName = "kalm-authz-policy"

func (r *KalmNSReconciler) reconcileAuthorizationPoliciesForTenant(tenant string) error {
	if tenant == "" {
		return v1alpha1.NoTenantFoundError
	}

	nsList := v1.NamespaceList{}
	if err := r.List(r.ctx, &nsList, client.MatchingLabels{v1alpha1.TenantNameLabelKey: tenant}); err != nil {
		return err
	}

	var sameTenantNSList []string
	for _, ns := range nsList.Items {
		sameTenantNSList = append(sameTenantNSList, ns.Name)
	}

	allowSameTenantNSRule := istioapisec.Rule{
		From: []*istioapisec.Rule_From{
			{Source: &istioapisec.Source{Namespaces: sameTenantNSList}},
		},
	}

	controlPlaneNSList := []string{"istio-system", "kube-system"}
	allowKalmControlPlaneNSRule := istioapisec.Rule{
		From: []*istioapisec.Rule_From{
			{Source: &istioapisec.Source{Namespaces: controlPlaneNSList}},
		},
	}

	for _, ns := range nsList.Items {
		expectedAuthzPolicy := istiosec.AuthorizationPolicy{
			ObjectMeta: metav1.ObjectMeta{
				Name:      authzPolicyName,
				Namespace: ns.Name,
			},
			Spec: istioapisec.AuthorizationPolicy{
				Action: istioapisec.AuthorizationPolicy_ALLOW,
				Rules: []*istioapisec.Rule{
					&allowSameTenantNSRule,
					&allowKalmControlPlaneNSRule,
				},
			},
		}

		isNew := false

		authzPolicy := istiosec.AuthorizationPolicy{}
		if err := r.Get(r.ctx, client.ObjectKey{Namespace: ns.Name, Name: authzPolicyName}, &authzPolicy); err != nil {
			if errors.IsNotFound(err) {
				isNew = true

				authzPolicy = expectedAuthzPolicy
			} else {
				return err
			}
		} else {
			authzPolicy.Spec = expectedAuthzPolicy.Spec
		}

		var err error
		if isNew {
			err = r.Create(r.ctx, &authzPolicy)
		} else {
			err = r.Update(r.ctx, &authzPolicy)
		}

		if err != nil {
			return err
		}
	}

	return nil
}

const networkPolicyName = "kalm-network-policy"

func (r *KalmNSReconciler) reconcileNetworkPoliciesForTenant(ns, tenant string) error {
	if tenant == "" {
		return v1alpha1.NoTenantFoundError
	}

	expectedNetworkPolicy := networkingv1.NetworkPolicy{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: ns,
			Name:      networkPolicyName,
		},
		Spec: networkingv1.NetworkPolicySpec{
			PodSelector: metav1.LabelSelector{},
			Ingress: []networkingv1.NetworkPolicyIngressRule{
				{
					From: []networkingv1.NetworkPolicyPeer{
						{
							NamespaceSelector: &metav1.LabelSelector{
								MatchLabels: map[string]string{
									v1alpha1.TenantNameLabelKey: tenant,
								},
							},
						},
						{
							// allow access from kalm-contrl-plane
							NamespaceSelector: &metav1.LabelSelector{
								MatchLabels: map[string]string{
									v1alpha1.KalmControlPlaneLabelKey: "true",
								},
							},
						},
					},
				},
			},
		},
	}

	isNew := false

	np := networkingv1.NetworkPolicy{}
	if err := r.Get(r.ctx, client.ObjectKey{Namespace: ns, Name: networkPolicyName}, &np); err != nil {
		if errors.IsNotFound(err) {
			isNew = true
			np = expectedNetworkPolicy
		} else {
			return err
		}
	} else {
		np.Spec = expectedNetworkPolicy.Spec
	}

	var err error
	if isNew {
		err = r.Create(r.ctx, &np)
	} else {
		err = r.Update(r.ctx, &np)
	}

	return err
}

// istio.AuthnPolicy
// allow access within kalm-control-plane namespaces
func (r *KalmNSReconciler) reconcileAuthorizationPoliciesForCtrlPlane(ns string) error {
	nsList := v1.NamespaceList{}
	if err := r.List(r.ctx, &nsList, client.MatchingLabels{v1alpha1.KalmControlPlaneLabelKey: "true"}); err != nil {
		return err
	}

	var ctrlPlaneNSList []string
	for _, tmpNS := range nsList.Items {
		ctrlPlaneNSList = append(ctrlPlaneNSList, tmpNS.Name)
	}

	expectedAuthnPolicy := istiosec.AuthorizationPolicy{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: ns,
			Name:      authzPolicyName,
		},
		Spec: istioapisec.AuthorizationPolicy{
			Action: istioapisec.AuthorizationPolicy_ALLOW,
			Rules: []*istioapisec.Rule{
				{
					From: []*istioapisec.Rule_From{
						{
							Source: &istioapisec.Source{
								Namespaces: ctrlPlaneNSList,
							},
						},
					},
				},
			},
		},
	}

	var authnPolicy istiosec.AuthorizationPolicy
	isNew := false

	err := r.Get(r.ctx, client.ObjectKey{Namespace: expectedAuthnPolicy.Namespace, Name: expectedAuthnPolicy.Name}, &authnPolicy)
	if err != nil {
		if errors.IsNotFound(err) {
			isNew = true

			authnPolicy = expectedAuthnPolicy
		} else {
			authnPolicy.Spec = expectedAuthnPolicy.Spec
		}
	}

	if isNew {
		err = r.Create(r.ctx, &authnPolicy)
	} else {
		err = r.Update(r.ctx, &authnPolicy)
	}

	return err
}

// k8s.NP, allow access within kalm-control-plane namespaces
func (r *KalmNSReconciler) reconcileNetworkPoliciesForCtrlPlane(ns string) error {
	expectedNetworkPolicy := networkingv1.NetworkPolicy{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: ns,
			Name:      networkPolicyName,
		},
		Spec: networkingv1.NetworkPolicySpec{
			PodSelector: metav1.LabelSelector{},
			Ingress: []networkingv1.NetworkPolicyIngressRule{
				{
					From: []networkingv1.NetworkPolicyPeer{
						{
							// allow access between kalm-contrl-plane
							NamespaceSelector: &metav1.LabelSelector{
								MatchLabels: map[string]string{
									v1alpha1.KalmControlPlaneLabelKey: "true",
								},
							},
						},
					},
				},
			},
		},
	}

	isNew := false

	np := networkingv1.NetworkPolicy{}
	if err := r.Get(r.ctx, client.ObjectKey{Namespace: ns, Name: networkPolicyName}, &np); err != nil {
		if errors.IsNotFound(err) {
			isNew = true
			np = expectedNetworkPolicy
		} else {
			return err
		}
	} else {
		np.Spec = expectedNetworkPolicy.Spec
	}

	var err error
	if isNew {
		err = r.Create(r.ctx, &np)
	} else {
		err = r.Update(r.ctx, &np)
	}

	return err
}

func (r *KalmNSReconciler) reconcileDefaultCAIssuerAndCert() error {

	expectedCAIssuer := v1alpha1.HttpsCertIssuer{
		ObjectMeta: metav1.ObjectMeta{
			Name: v1alpha1.DefaultCAIssuerName,
		},
		Spec: v1alpha1.HttpsCertIssuerSpec{
			CAForTest: &v1alpha1.CAForTestIssuer{},
		},
	}

	currentCAIssuer := v1alpha1.HttpsCertIssuer{}
	err := r.Get(r.ctx, types.NamespacedName{
		Name: v1alpha1.DefaultCAIssuerName,
	}, &currentCAIssuer)
	if err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		if err := r.Create(r.ctx, &expectedCAIssuer); err != nil {
			return err
		}
	} else {
		currentCAIssuer.Spec = expectedCAIssuer.Spec
		if err := r.Update(r.ctx, &currentCAIssuer); err != nil {
			return err
		}
	}

	// defaultCertName := "default-https-cert"
	// expectedCert := v1alpha1.HttpsCert{
	// 	ObjectMeta: metav1.ObjectMeta{
	// 		Name: defaultCertName,
	// 		Labels: map[string]string{
	// 			v1alpha1.TenantNameLabelKey: r.
	// 		},
	// 	},
	// 	Spec: v1alpha1.HttpsCertSpec{
	// 		HttpsCertIssuer: v1alpha1.DefaultCAIssuerName,
	// 		Domains:         []string{"*"},
	// 	},
	// }

	// var currentCert v1alpha1.HttpsCert
	// if err = r.Get(r.ctx, types.NamespacedName{Name: defaultCertName}, &currentCert); err != nil {
	// 	if !errors.IsNotFound(err) {
	// 		return err
	// 	}

	// 	return r.Create(r.ctx, &expectedCert)
	// } else {
	// 	currentCert.Spec = expectedCert.Spec
	// 	return r.Update(r.ctx, &currentCert)
	// }
	return nil
}

func (r *KalmNSReconciler) reconcileDefaultHTTP01Issuer() error {

	expectedHTTP01Issuer := v1alpha1.HttpsCertIssuer{
		ObjectMeta: metav1.ObjectMeta{
			Name: v1alpha1.DefaultHTTP01IssuerName,
		},
		Spec: v1alpha1.HttpsCertIssuerSpec{
			HTTP01: &v1alpha1.HTTP01Issuer{},
		},
	}

	currentIssuer := v1alpha1.HttpsCertIssuer{}
	err := r.Get(r.ctx, types.NamespacedName{Name: v1alpha1.DefaultHTTP01IssuerName}, &currentIssuer)
	if err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		if err := r.Create(r.ctx, &expectedHTTP01Issuer); err != nil {
			return err
		}
	} else {
		currentIssuer.Spec = expectedHTTP01Issuer.Spec
		if err := r.Update(r.ctx, &currentIssuer); err != nil {
			return err
		}
	}

	return nil
}

var CommonConfigMapName = "common"

func (r *KalmNSReconciler) reconcileCommonConfigMap(nsName string) error {

	initCM := v1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: nsName,
			Name:      CommonConfigMapName,
		},
	}

	cmKey := client.ObjectKey{
		Namespace: initCM.Namespace,
		Name:      initCM.Name,
	}

	// simply ensure this configMap exist
	if err := r.Get(r.ctx, cmKey, &v1.ConfigMap{}); err != nil {
		if errors.IsNotFound(err) {
			return r.Create(r.ctx, &initCM)
		} else {
			return err
		}
	}

	return nil
}

var CommonSecretName = "common"

func (r *KalmNSReconciler) reconcileCommonSecret(nsName string) error {

	initSecret := v1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: nsName,
			Name:      CommonSecretName,
		},
	}

	key := client.ObjectKey{
		Namespace: initSecret.Namespace,
		Name:      initSecret.Name,
	}

	if err := r.Get(r.ctx, key, &v1.Secret{}); err != nil {
		if errors.IsNotFound(err) {
			return r.Create(r.ctx, &initSecret)
		} else {
			return err
		}
	}

	return nil
}
