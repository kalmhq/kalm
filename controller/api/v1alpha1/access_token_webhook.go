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
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	apimachineryvalidation "k8s.io/apimachinery/pkg/api/validation"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// log is for logging in this package.
var accesstokenlog = logf.Log.WithName("accesstoken-resource")

func (r *AccessToken) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-accesstoken,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=accesstokens,verbs=create;update,versions=v1alpha1,name=maccesstoken.kb.io

var _ webhook.Defaulter = &AccessToken{}

// Default implements webhook.Defaulter so a webhook will be registered for the type
func (r *AccessToken) Default() {
	accesstokenlog.Info("default", "name", r.Name)
}

// +kubebuilder:webhook:verbs=create;update;delete,path=/validate-core-kalm-dev-v1alpha1-accesstoken,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=accesstokens,versions=v1alpha1,name=vaccesstoken.kb.io

var _ webhook.Validator = &AccessToken{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *AccessToken) ValidateCreate() error {
	accesstokenlog.Info("validate create", "name", r.Name)

	if err := r.validate(); err != nil {
		return err
	}

	return nil
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *AccessToken) ValidateUpdate(old runtime.Object) error {
	accesstokenlog.Info("validate update", "name", r.Name)

	if oldAccessToken, ok := old.(*AccessToken); !ok {
		return fmt.Errorf("old object is not an access token")
	} else {
		if r.Spec.Creator != oldAccessToken.Spec.Creator {
			return fmt.Errorf("Can't modify creator")
		}
	}

	if oldAccessToken, ok := old.(*AccessToken); !ok {
		return fmt.Errorf("old object is not an access token")
	} else {
		if r.Spec.Token != oldAccessToken.Spec.Token {
			return fmt.Errorf("Can't modify token")
		}
	}

	return r.validate()
}

func GetAccessTokenNameFromToken(token string) string {
	tokenHash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(tokenHash[:])
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *AccessToken) ValidateDelete() error {
	accesstokenlog.Info("validate delete", "name", r.Name)

	return nil
}

func (r *AccessToken) validate() error {
	var rst KalmValidateErrorList

	expectedName := GetAccessTokenNameFromToken(r.Spec.Token)

	if expectedName != r.Name {
		rst = append(rst, KalmValidateError{
			Err:  fmt.Sprintf("name and token hash are not matched. Expect name: %s, but got %s", expectedName, r.Name),
			Path: "spec.token",
		})
	}

	for i, rule := range r.Spec.Rules {
		if rule.Namespace != "*" {
			errs := apimachineryvalidation.ValidateNamespaceName(rule.Namespace, false)

			if len(errs) != 0 {
				rst = append(rst, KalmValidateError{
					Err:  fmt.Sprintf("invalid namespace: %s", rule.Namespace),
					Path: fmt.Sprintf("spec.rules[%d].namespace", i),
				})
			}
		}

		if rule.Name != "*" {
			if !isValidResourceName(rule.Name) {
				rst = append(rst, KalmValidateError{
					Err:  fmt.Sprintf("invalid resource instance name: %s", rule.Name),
					Path: fmt.Sprintf("spec.rules[%d].name", i),
				})
			}
		}
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}
