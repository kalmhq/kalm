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
		// need do nothing
	}

	var expectedRoles []v1beta1.Role

	switch deployKey.Spec.Type {
	case corev1alpha1.DeployKeyTypeAll:
		//todo

	case corev1alpha1.DeployKeyTypeApp:
		for _, ns := range deployKey.Spec.Content {
			expectedRole := v1beta1.Role{
				ObjectMeta: ctrl.ObjectMeta{
					Namespace: ns,
					Name:      deployKey.Name,
				},
				Rules: []v1beta1.PolicyRule{
					{
						Verbs:     []string{"get", "list", "watch", "update"},
						APIGroups: []string{"core.kalm.dev"},
						Resources: []string{"components"},
					},
				},
			}

			expectedRoles = append(expectedRoles, expectedRole)
		}
	case corev1alpha1.DeployKeyTypeComponent:
		ns2ComponentsMap := make(map[string][]string)
		for _, content := range deployKey.Spec.Content {
			parts := strings.Split(content, "/")
			if len(parts) != 2 {
				r.Recorder.Event(&deployKey, v1.EventTypeWarning, "invalid-format", "should be like: ns/component")
			}

			ns := parts[0]
			comp := parts[1]

			ns2ComponentsMap[ns] = append(ns2ComponentsMap[ns], comp)
		}

		for ns, compList := range ns2ComponentsMap {
			expectedRole := v1beta1.Role{
				ObjectMeta: ctrl.ObjectMeta{
					Namespace: ns,
					Name:      deployKey.Name,
				},
				Rules: []v1beta1.PolicyRule{
					{
						Verbs:         []string{"get", "list", "watch", "update"},
						APIGroups:     []string{"core.kalm.dev"},
						Resources:     []string{"components"},
						ResourceNames: compList,
					},
				},
			}

			expectedRoles = append(expectedRoles, expectedRole)
		}
	default:
		return fmt.Errorf("unknown deployKey type: %s", deployKey.Spec.Type)
	}

	// todo check and filter roles belongs to existing namespace

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

func (r *DeployKeyReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.DeployKey{}).
		Complete(r)
}
