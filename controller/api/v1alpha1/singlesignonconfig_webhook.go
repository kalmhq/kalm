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
	"encoding/json"
	"fmt"
	"strconv"

	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/util/validation/field"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// log is for logging in this package.
var singlesignonconfiglog = logf.Log.WithName("singlesignonconfig-resource")

var SSODefaultIDTokenExpirySeconds = uint32(300)

func (r *SingleSignOnConfig) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

const (
	SSOConnectorTypeGithub = "github"
	SSOConnectorTypeGitlab = "gitlab"
	SSOConnectorTypeGoogle = "google"
)

// +kubebuilder:object:generate=false
type SSOGithubConnector struct {
	ID     string `json:"id"`
	Type   string `json:"type"`
	Name   string `json:"name"`
	Config struct {
		ClientID     string `json:"clientID"`
		ClientSecret string `json:"clientSecret"`
		Orgs         []struct {
			Name  string   `json:"name"`
			Teams []string `json:"teams"`
		} `json:"orgs"`
	} `json:"config"`
}

// +kubebuilder:object:generate=false
type SSOGitlabConnector struct {
	ID     string `json:"id"`
	Type   string `json:"type"`
	Name   string `json:"name"`
	Config struct {
		BaseURL      string   `json:"baseURL"`
		ClientID     string   `json:"clientID"`
		ClientSecret string   `json:"clientSecret"`
		Groups       []string `json:"groups"`
	} `json:"config"`
}

// +kubebuilder:object:generate=false
type SSOGoogleConnector struct {
	ID     string `json:"id"`
	Type   string `json:"type"`
	Name   string `json:"name"`
	Config struct {
		HostedDomains string   `json:"hostedDomains"`
		ClientID      string   `json:"clientID"`
		ClientSecret  string   `json:"clientSecret"`
		Groups        []string `json:"groups"`
	} `json:"config"`
}

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-singlesignonconfig,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=singlesignonconfigs,verbs=create;update,versions=v1alpha1,name=msinglesignonconfig.kb.io

var _ webhook.Defaulter = &SingleSignOnConfig{}

// Default implements webhook.Defaulter so a webhook will be registered for the type
func (r *SingleSignOnConfig) Default() {
	singlesignonconfiglog.Info("default", "name", r.Name)

	if r.Spec.IDTokenExpirySeconds == nil {
		r.Spec.IDTokenExpirySeconds = &SSODefaultIDTokenExpirySeconds
	}
}

// +kubebuilder:webhook:verbs=create;update,path=/validate-core-kalm-dev-v1alpha1-singlesignonconfig,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=singlesignonconfigs,versions=v1alpha1,name=vsinglesignonconfig.kb.io

var _ webhook.Validator = &SingleSignOnConfig{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *SingleSignOnConfig) ValidateCreate() error {
	singlesignonconfiglog.Info("validate create", "name", r.Name)
	return r.commonValidate()
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *SingleSignOnConfig) ValidateUpdate(old runtime.Object) error {
	singlesignonconfiglog.Info("validate update", "name", r.Name)
	return r.commonValidate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *SingleSignOnConfig) ValidateDelete() error {
	singlesignonconfiglog.Info("validate delete", "name", r.Name)
	return nil
}

func (r *SingleSignOnConfig) commonValidate() error {
	var allErrs field.ErrorList

	if r.Spec.Domain == "" {
		allErrs = append(allErrs, field.Invalid(field.NewPath("spec").Child("domain"), r.Name, "Domain can't be blank."))
	}

	if r.Spec.Issuer != "" {
		if len(r.Spec.Connectors) > 0 {
			allErrs = append(allErrs, field.Invalid(field.NewPath("spec"), r.Name, "Connectors should be blank when using customize oidc mode."))
		}

		if r.Spec.TemporaryUser != nil {
			allErrs = append(allErrs, field.Invalid(field.NewPath("spec"), r.Name, "TemporaryUser should be blank when using customize oidc mode."))
		}
	} else {
		if len(r.Spec.Connectors) == 0 && r.Spec.TemporaryUser == nil {
			allErrs = append(allErrs, field.Invalid(field.NewPath("spec"), r.Name, "Connectors and TemporaryUser can't be blank at the same time, when using dex oidc mode."))
		}

		for i := range r.Spec.Connectors {
			connector := r.Spec.Connectors[i]
			basePath := field.NewPath("spec", "connectors", strconv.Itoa(i))

			if connector.Type == SSOConnectorTypeGithub {
				bts, err := json.Marshal(connector)

				if err != nil {
					allErrs = append(allErrs, field.Invalid(basePath, r.Name, "Marshal to json failed."))
					continue
				}

				var typeConnector SSOGithubConnector
				err = json.Unmarshal(bts, &typeConnector)

				if err != nil {
					allErrs = append(allErrs, field.Invalid(basePath, r.Name, "Unmarshal to json failed."))
					continue
				}

				if typeConnector.Config.ClientID == "" {
					allErrs = append(allErrs, field.Invalid(basePath.Child("config", "clientID"), r.Name, "Can't be blank"))
				}

				if typeConnector.Config.ClientSecret == "" {
					allErrs = append(allErrs, field.Invalid(basePath.Child("config", "clientSecret"), r.Name, "Can't be blank"))
				}

				if len(typeConnector.Config.Orgs) == 0 {
					allErrs = append(allErrs, field.Invalid(basePath.Child("config", "orgs"), r.Name, "Can't be blank"))
				}

				for j := range typeConnector.Config.Orgs {
					org := typeConnector.Config.Orgs[j]

					if org.Name == "" {
						allErrs = append(allErrs, field.Invalid(basePath.Child("config", "orgs", strconv.Itoa(j)), r.Name, "Can't be blank"))
					}
				}
			} else if connector.Type == SSOConnectorTypeGitlab {
				bts, err := json.Marshal(connector)

				if err != nil {
					allErrs = append(allErrs, field.Invalid(basePath, r.Name, "Marshal to json failed."))
					continue
				}

				var typeConnector SSOGitlabConnector
				err = json.Unmarshal(bts, &typeConnector)

				if err != nil {
					allErrs = append(allErrs, field.Invalid(basePath, r.Name, "Unmarshal to json failed."))
					continue
				}

				if typeConnector.Config.ClientID == "" {
					allErrs = append(allErrs, field.Invalid(basePath.Child("config", "clientID"), r.Name, "Can't be blank"))
				}

				if typeConnector.Config.ClientSecret == "" {
					allErrs = append(allErrs, field.Invalid(basePath.Child("config", "clientSecret"), r.Name, "Can't be blank"))
				}

				if len(typeConnector.Config.Groups) == 0 {
					allErrs = append(allErrs, field.Invalid(basePath.Child("config", "groups"), r.Name, "Can't be blank"))
				}

				for j := range typeConnector.Config.Groups {
					groupName := typeConnector.Config.Groups[j]

					if groupName == "" {
						allErrs = append(allErrs, field.Invalid(basePath.Child("config", "groups", strconv.Itoa(j)), r.Name, "Can't be blank"))
					}
				}
			} else if connector.Type == SSOConnectorTypeGoogle {
				bts, err := json.Marshal(connector)

				if err != nil {
					allErrs = append(allErrs, field.Invalid(basePath, r.Name, "Marshal to json failed."))
					continue
				}

				var typeConnector SSOGoogleConnector
				err = json.Unmarshal(bts, &typeConnector)

				if err != nil {
					allErrs = append(allErrs, field.Invalid(basePath, r.Name, "Unmarshal to json failed."))
					continue
				}

				if typeConnector.Config.ClientID == "" {
					allErrs = append(allErrs, field.Invalid(basePath.Child("config", "clientID"), r.Name, "Can't be blank"))
				}

				if typeConnector.Config.ClientSecret == "" {
					allErrs = append(allErrs, field.Invalid(basePath.Child("config", "clientSecret"), r.Name, "Can't be blank"))
				}

				if len(typeConnector.Config.Groups) == 0 {
					allErrs = append(allErrs, field.Invalid(basePath.Child("config", "groups"), r.Name, "Can't be blank"))
				}

				for j := range typeConnector.Config.Groups {
					groupName := typeConnector.Config.Groups[j]

					if groupName == "" {
						allErrs = append(allErrs, field.Invalid(basePath.Child("config", "groups", strconv.Itoa(j)), r.Name, "Can't be blank"))
					}
				}
			} else {
				allErrs = append(allErrs, field.Invalid(basePath, r.Name, fmt.Sprintf("Unsupport connector type: %s", connector.Type)))
			}
		}
	}

	if len(allErrs) == 0 {
		return nil
	}

	return errors.NewInvalid(
		schema.GroupKind{Group: GroupVersion.Group, Kind: "SingleSignOnConfig"},
		r.Name,
		allErrs,
	)
}
