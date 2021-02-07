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

package v1alpha1

import (
	"crypto/md5"
	"fmt"

	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// log is for logging in this package.
var rolebindinglog = logf.Log.WithName("rolebinding-resource")

func (r *RoleBinding) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-rolebinding,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=rolebindings,verbs=create;update,versions=v1alpha1,name=mrolebinding.kb.io

var _ webhook.Defaulter = &RoleBinding{}

// Default implements webhook.Defaulter so a webhook will be registered for the type
func (r *RoleBinding) Default() {
	rolebindinglog.Info("default", "name", r.Name)
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kalm-dev-v1alpha1-rolebinding,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=rolebindings,versions=v1alpha1,name=vrolebinding.kb.io

var _ webhook.Validator = &RoleBinding{}

func (r *RoleBinding) GetNameBaseOnRoleAndSubject() string {
	switch r.Spec.Role {
	case ClusterRoleViewer, ClusterRoleEditor, ClusterRoleOwner:
		return fmt.Sprintf("cluster-rolebinding-%x", md5.Sum([]byte(r.Spec.Subject)))
	default:
		return fmt.Sprintf("%s-rolebinding-%x", r.Namespace, md5.Sum([]byte(r.Spec.Subject)))
	}
}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *RoleBinding) ValidateCreate() error {
	rolebindinglog.Info("validate create", "name", r.Name)

	if err := r.validate(); err != nil {
		return err
	}

	return nil
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *RoleBinding) ValidateUpdate(old runtime.Object) error {
	rolebindinglog.Info("validate update", "name", r.Name)

	if oldRoleBinding, ok := old.(*RoleBinding); !ok {
		return fmt.Errorf("old object is not an role binding")
	} else {
		if r.Spec.Creator != oldRoleBinding.Spec.Creator {
			return fmt.Errorf("Can't modify creator")
		}

		if r.Spec.Subject != oldRoleBinding.Spec.Subject {
			return fmt.Errorf("Can't modify subject")
		}

		switch oldRoleBinding.Spec.Role {
		case ClusterRoleOwner, ClusterRoleViewer, ClusterRoleEditor:
			switch r.Spec.Role {
			case ClusterRoleOwner, ClusterRoleViewer, ClusterRoleEditor:
			default:
				return fmt.Errorf("Can't modify role scope from cluster to namespace.")
			}
		default:
			switch r.Spec.Role {
			case ClusterRoleOwner, ClusterRoleViewer, ClusterRoleEditor:
				return fmt.Errorf("Can't modify role scope from namespace to cluster.")
			}
		}
	}

	return r.validate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *RoleBinding) ValidateDelete() error {
	rolebindinglog.Info("validate delete", "name", r.Name)

	if IsKalmSystemNamespace(r.Namespace) {
		return nil
	}

	return nil
}

func (r *RoleBinding) validate() error {
	var rst KalmValidateErrorList

	switch r.Spec.Role {
	case ClusterRoleEditor, ClusterRoleOwner, ClusterRoleViewer, RolePlaceholder, RoleSuspended:
		if r.Namespace != KalmSystemNamespace {
			rst = append(rst, KalmValidateError{
				Err:  "cluster role binding mush be created in kalm-system namespace",
				Path: ".spec.role",
			})
		}
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}
