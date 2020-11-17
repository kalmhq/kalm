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
	"context"
	"fmt"

	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/api/resource"

	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// log is for logging in this package.
var dockerregistrylog = logf.Log.WithName("dockerregistry-resource")

func (r *DockerRegistry) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

// +kubebuilder:webhook:path=/mutate-core-kalm-dev-v1alpha1-dockerregistry,mutating=true,failurePolicy=fail,groups=core.kalm.dev,resources=dockerregistries,verbs=create;update,versions=v1alpha1,name=mdockerregistry.kb.io

var _ webhook.Defaulter = &DockerRegistry{}

// The empty host is a special value for docker hub. Do not change it
func (r *DockerRegistry) Default() {

}

// +kubebuilder:webhook:verbs=create;update;delete,path=/validate-core-kalm-dev-v1alpha1-dockerregistry,mutating=false,failurePolicy=fail,groups=core.kalm.dev,resources=dockerregistries,versions=v1alpha1,name=vdockerregistry.kb.io

var _ webhook.Validator = &DockerRegistry{}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *DockerRegistry) ValidateCreate() error {
	dockerregistrylog.Info("validate create", "name", r.Name)

	if !HasTenantSet(r) {
		return NoTenantFoundError
	}

	if err := r.validate(); err != nil {
		return err
	}

	tenantName := r.Labels[TenantNameLabelKey]

	var dockerRegistries DockerRegistryList
	if err := webhookClient.List(context.Background(), &dockerRegistries, client.MatchingLabels{TenantNameLabelKey: tenantName}); err != nil {
		return err
	}

	if err := tryReCountAndUpdateResourceForTenant(tenantName, ResourceDockerRegistriesCount, r, dockerRegistriesToObjList(dockerRegistries.Items), false); err != nil {
		dockerregistrylog.Error(err, "fail when try to allocate resource", "ns/name", getKey(r))
		return err
	}

	return nil
}

func dockerRegistriesToObjList(items []DockerRegistry) []runtime.Object {
	var rst []runtime.Object
	for i := range items {
		item := items[i]
		rst = append(rst, &item)
	}
	return rst
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *DockerRegistry) ValidateUpdate(old runtime.Object) error {
	dockerregistrylog.Info("validate update", "name", r.Name)

	if !HasTenantSet(r) {
		return NoTenantFoundError
	}

	if IsTenantChanged(r, old) {
		return TenantChangedError
	}

	return r.validate()
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *DockerRegistry) ValidateDelete() error {
	dockerregistrylog.Info("validate delete", "name", r.Name)

	tenantName := r.Labels[TenantNameLabelKey]
	if tenantName == "" {
		dockerregistrylog.Info("see dockerRegistry without tenant", "ns/name", getKey(r))
		return nil
	}

	var dockerRegistries DockerRegistryList
	if err := webhookClient.List(context.Background(), &dockerRegistries, client.MatchingLabels{TenantNameLabelKey: tenantName}); err != nil {
		return err
	}

	if err := tryReCountAndUpdateResourceForTenant(tenantName, ResourceDockerRegistriesCount, r, dockerRegistriesToObjList(dockerRegistries.Items), true); err != nil {
		dockerregistrylog.Error(err, "fail when try to release resource, ignored", "ns/name", getKey(r))
	}

	return nil
}

func tryReCountResourceForTenant(currentObj runtime.Object, objList []runtime.Object, isDelete bool) int {

	resMap := make(map[string]runtime.Object)

	resMap[getKey(currentObj)] = currentObj
	for _, obj := range objList {
		resMap[getKey(obj)] = obj
	}

	var cnt int
	for _, cur := range resMap {
		// ignore resource being deleted
		objMeta, err := meta.Accessor(cur)
		if err == nil && objMeta.GetDeletionTimestamp() != nil {
			continue
		}

		if getKey(cur) == getKey(currentObj) {
			// if deleting current resource, ignore in count
			if isDelete {
				continue
			}
		}

		cnt++
	}

	return cnt
}

func tryReCountAndUpdateResourceForTenant(tenantName string, resName ResourceName, currentObj runtime.Object, objList []runtime.Object, isDelete bool) error {

	cnt := tryReCountResourceForTenant(currentObj, objList, isDelete)

	cntQuantity := resource.NewQuantity(int64(cnt), resource.DecimalSI)
	fmt.Println("cntQuantity", cntQuantity, "resName", resName, "tenant", tenantName)
	if err := SetTenantResourceByName(tenantName, resName, *cntQuantity); err != nil {
		return err
	}

	return nil
}

func getKey(obj runtime.Object) string {
	objMeta, err := meta.Accessor(obj)
	if err != nil {
		//todo, return err?
		return ""
	}

	key := fmt.Sprintf("%s/%s", objMeta.GetNamespace(), objMeta.GetName())
	return key
}

func (r *DockerRegistry) validate() error {
	var rst KalmValidateErrorList

	if r.Spec.Host != "" {
		if isValid := isValidURL(r.Spec.Host); !isValid {
			rst = append(rst, KalmValidateError{
				Err:  "invalid url",
				Path: "spec.host",
			})
		}
	}

	intervalSec := r.Spec.PoolingIntervalSeconds
	if intervalSec != nil {
		if *intervalSec <= 0 {
			rst = append(rst, KalmValidateError{
				Err:  "should be positive int",
				Path: "spec.poolingIntervalSeconds",
			})
		}
	}

	if len(rst) == 0 {
		return nil
	}

	return rst
}
