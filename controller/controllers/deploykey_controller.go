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
	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/api/rbac/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"
	"strings"
)

// DeployKeyReconciler reconciles a DeployKey object
type DeployKeyReconciler struct {
	*BaseReconciler
}

type DeployKeyReconcilerTask struct {
	*DeployKeyReconciler
	ctx context.Context
}

var retryLaterErr = fmt.Errorf("retry later")

// +kubebuilder:rbac:groups=core.kalm.dev,resources=deploykeys,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=deploykeys/status,verbs=get;update;patch
// +kubebuilder:rbac:groups="",resources=serviceaccounts,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=namespaces;secrets,verbs=get;list;watch
// +kubebuilder:rbac:groups="rbac.authorization.k8s.io",resources=roles;rolebindings,verbs=get;list;watch;create;update;patch;delete

func (r *DeployKeyReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	task := &DeployKeyReconcilerTask{
		DeployKeyReconciler: r,
		ctx:                 context.Background(),
	}

	err := task.Run(req)
	if err == retryLaterErr {
		return ctrl.Result{Requeue: true}, nil
	}

	return ctrl.Result{}, err
}

const NamespaceKalmSystem = "kalm-system"

func (r *DeployKeyReconcilerTask) Run(req ctrl.Request) error {
	var deployKey corev1alpha1.DeployKey
	if err := r.Get(r.ctx, req.NamespacedName, &deployKey); err != nil {
		if errors.IsNotFound(err) {
			return nil
		}

		return err
	}

	saKey := types.NamespacedName{
		Namespace: NamespaceKalmSystem,
		Name:      deployKey.Name,
	}

	expectedSA := v1.ServiceAccount{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: saKey.Namespace,
			Name:      saKey.Name,
			Labels: map[string]string{
				KalmLabelManaged: "true",
			},
		},
	}

	sa := v1.ServiceAccount{}
	err := r.Get(r.ctx, saKey, &sa)
	if err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		sa = expectedSA

		if err := ctrl.SetControllerReference(&deployKey, &sa, r.Scheme); err != nil {
			return err
		}

		if err := r.Create(r.ctx, &expectedSA); err != nil {
			return err
		}
	} else {
		sa.Labels = mergeMap(sa.Labels, expectedSA.Labels)
		if err := r.Update(r.ctx, &sa); err != nil {
			return err
		}
	}

	var expectedRoles []v1beta1.Role

	switch deployKey.Spec.Scope {
	case corev1alpha1.DeployKeyTypeCluster:
		var nsList v1.NamespaceList
		err := r.List(r.ctx, &nsList, client.MatchingLabels{KalmEnableLabelName: KalmEnableLabelValue})
		if err != nil {
			return err
		}

		var nsSlice []string
		for _, ns := range nsList.Items {
			nsSlice = append(nsSlice, ns.Name)
		}

		expectedRoles, err = r.prepareRoles(deployKey.Name, nsSlice)
		if err != nil {
			return err
		}
	case corev1alpha1.DeployKeyTypeNamespace:
		var validNs []string
		for _, ns := range deployKey.Spec.Resources {
			exist, err := r.isNamespaceExist(ns)

			if err != nil {
				return err
			}

			if !exist {
				continue
			}

			validNs = append(validNs, ns)
		}

		expectedRoles, err = r.prepareRoles(deployKey.Name, validNs)
		if err != nil {
			return err
		}
	case corev1alpha1.DeployKeyTypeComponent:
		ns2ComponentsMap := make(map[string][]string)
		for _, content := range deployKey.Spec.Resources {
			parts := strings.Split(content, "/")

			if len(parts) != 2 {
				r.Recorder.Event(&deployKey, v1.EventTypeWarning, "invalid-format", "should be like: ns/component")
				continue
			}

			ns := parts[0]
			comp := parts[1]

			ns2ComponentsMap[ns] = append(ns2ComponentsMap[ns], comp)
		}

		for ns, compList := range ns2ComponentsMap {
			exist, err := r.isNamespaceExist(ns)
			if err != nil {
				return err
			}

			if !exist {
				continue
			}

			expectedRole := v1beta1.Role{
				ObjectMeta: ctrl.ObjectMeta{
					Namespace: ns,
					Name:      deployKey.Name,
					Labels: map[string]string{
						KalmLabelManaged: "true",
					},
				},
				Rules: []v1beta1.PolicyRule{
					{
						Verbs:         []string{"get", "patch"},
						APIGroups:     []string{"core.kalm.dev"},
						Resources:     []string{"components"},
						ResourceNames: compList,
					},
				},
			}

			expectedRoles = append(expectedRoles, expectedRole)
		}
	default:
		return fmt.Errorf("unknown deployKey type: %s", deployKey.Spec.Scope)
	}

	var resRoles []v1beta1.Role
	for _, expectedRole := range expectedRoles {
		key := types.NamespacedName{
			Namespace: expectedRole.Namespace,
			Name:      expectedRole.Name,
		}

		role := v1beta1.Role{}
		err = r.Get(r.ctx, key, &role)
		if err != nil {
			if !errors.IsNotFound(err) {
				return err
			}

			role = expectedRole

			if err := ctrl.SetControllerReference(&deployKey, &role, r.Scheme); err != nil {
				return err
			}

			if err := r.Create(r.ctx, &role); err != nil {
				return err
			}
		} else {
			role.Rules = expectedRole.Rules
			role.Labels = mergeMap(role.Labels, expectedRole.Labels)

			if err := r.Update(r.ctx, &role); err != nil {
				return err
			}
		}

		resRoles = append(resRoles, role)
	}

	// ensure binding
	for _, resRole := range resRoles {
		roleBindingKey := types.NamespacedName{
			Namespace: resRole.Namespace,
			Name:      resRole.Name,
		}

		expectedRoleBinding := v1beta1.RoleBinding{
			ObjectMeta: ctrl.ObjectMeta{
				Namespace: roleBindingKey.Namespace,
				Name:      roleBindingKey.Name,
				Labels: map[string]string{
					KalmLabelManaged: "true",
				},
			},
			Subjects: []v1beta1.Subject{
				{
					Kind:      "ServiceAccount",
					Name:      expectedSA.Name,
					Namespace: expectedSA.Namespace,
				},
			},
			RoleRef: v1beta1.RoleRef{
				Kind:     "Role",
				Name:     resRole.Name,
				APIGroup: "rbac.authorization.k8s.io",
			},
		}

		roleBinding := v1beta1.RoleBinding{}
		err = r.Get(r.ctx, roleBindingKey, &roleBinding)

		if err != nil {
			if !errors.IsNotFound(err) {
				return err
			}

			roleBinding = expectedRoleBinding

			if err := ctrl.SetControllerReference(&deployKey, &roleBinding, r.Scheme); err != nil {
				return err
			}

			if err := r.Create(r.ctx, &roleBinding); err != nil {
				return err
			}
		} else {
			roleBinding.Subjects = expectedRoleBinding.Subjects
			roleBinding.RoleRef = expectedRoleBinding.RoleRef
			roleBinding.Labels = mergeMap(roleBinding.Labels, expectedRoleBinding.Labels)

			if err := r.Update(r.ctx, &roleBinding); err != nil {
				return err
			}
		}
	}

	err = r.Get(r.ctx, types.NamespacedName{Namespace: sa.Namespace, Name: sa.Name}, &sa)
	if err != nil {
		return err
	}

	if len(sa.Secrets) <= 0 {
		return retryLaterErr
	}

	secObjRef := sa.Secrets[0]

	var sec v1.Secret
	err = r.Get(r.ctx, types.NamespacedName{Namespace: sa.Namespace, Name: secObjRef.Name}, &sec)
	if err != nil {
		if errors.IsNotFound(err) {
			return retryLaterErr
		}

		return err
	}

	v, exist := sec.Data["token"]
	if !exist || len(v) == 0 {
		return retryLaterErr
	}

	deployKey.Status.ServiceAccountToken = string(v)
	return r.Status().Update(r.ctx, &deployKey)
}

func (r *DeployKeyReconcilerTask) isNamespaceExist(namespace string) (bool, error) {
	ns := v1.Namespace{}
	err := r.Get(r.ctx, client.ObjectKey{Name: namespace}, &ns)
	if err != nil {
		if errors.IsNotFound(err) {
			return false, nil
		}

		return false, err
	}

	return true, nil
}

func (r *DeployKeyReconcilerTask) prepareRoles(roleName string, nsList []string) ([]v1beta1.Role, error) {

	var rst []v1beta1.Role
	for _, ns := range nsList {

		expectedRole := v1beta1.Role{
			ObjectMeta: ctrl.ObjectMeta{
				Namespace: ns,
				Name:      roleName,
				Labels: map[string]string{
					KalmLabelManaged: "true",
				},
			},
			Rules: []v1beta1.PolicyRule{
				{
					Verbs:     []string{"get", "patch"},
					APIGroups: []string{"core.kalm.dev"},
					Resources: []string{"components"},
				},
			},
		}

		rst = append(rst, expectedRole)
	}

	return rst, nil
}

func (r *DeployKeyReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.DeployKey{}).
		Watches(
			&source.Kind{Type: &v1.ServiceAccount{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: DeployKeyGeneralMapper{r.BaseReconciler},
			}).
		Watches(
			&source.Kind{Type: &v1beta1.Role{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: DeployKeyGeneralMapper{r.BaseReconciler},
			}).
		Watches(
			&source.Kind{Type: &v1beta1.RoleBinding{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: DeployKeyGeneralMapper{r.BaseReconciler},
			}).
		Watches(
			&source.Kind{Type: &v1.Namespace{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: DeployKeyNamespaceMapper{r.BaseReconciler},
			}).
		Complete(r)
}

type DeployKeyGeneralMapper struct {
	*BaseReconciler
}

func (s DeployKeyGeneralMapper) Map(object handler.MapObject) []reconcile.Request {
	labels := object.Meta.GetLabels()
	if labels == nil || labels[KalmLabelManaged] != "true" {
		return nil
	}

	return []reconcile.Request{
		{
			NamespacedName: client.ObjectKey{
				Name: object.Meta.GetName(),
			},
		},
	}
}

type DeployKeyNamespaceMapper struct {
	*BaseReconciler
}

func (s DeployKeyNamespaceMapper) Map(object handler.MapObject) []reconcile.Request {
	labels := object.Meta.GetLabels()
	if labels == nil || labels[KalmEnableLabelName] != KalmEnableLabelValue {
		return nil
	}

	// trigger update
	return mapTypeAllDeployKeyToReqs(s.BaseReconciler)
}

func mapTypeAllDeployKeyToReqs(b *BaseReconciler) []reconcile.Request {
	var dKeys corev1alpha1.DeployKeyList
	err := b.List(context.Background(), &dKeys)
	if err != nil {
		b.Log.Error(err, "fail list deployKeys")
		return nil
	}

	var rst []reconcile.Request
	for _, dKey := range dKeys.Items {
		if dKey.Spec.Scope != corev1alpha1.DeployKeyTypeCluster {
			continue
		}

		rst = append(rst, reconcile.Request{
			NamespacedName: types.NamespacedName{
				Namespace: dKey.Namespace,
				Name:      dKey.Name,
			},
		})
	}

	return rst
}

func NewDeployKeyReconciler(mgr ctrl.Manager) *DeployKeyReconciler {
	return &DeployKeyReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "DeployKey"),
	}
}
