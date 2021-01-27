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
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/heroku/docker-registry-client/registry"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	"sigs.k8s.io/controller-runtime/pkg/source"

	corev1alpha1 "github.com/kalmhq/kalm/controller/api/v1alpha1"
)

// DockerRegistryReconciler reconciles a DockerRegistry object
type DockerRegistryReconciler struct {
	*BaseReconciler
}

type DockerRegistryReconcileTask struct {
	*DockerRegistryReconciler
	ctx      context.Context
	registry *corev1alpha1.DockerRegistry
	secret   *v1.Secret
}

func (r *DockerRegistryReconcileTask) WarningEvent(err error, msg string, args ...interface{}) {
	r.EmitWarningEvent(r.registry, err, msg, args...)
}

func (r *DockerRegistryReconcileTask) NormalEvent(reason, msg string, args ...interface{}) {
	r.EmitNormalEvent(r.registry, reason, msg, args...)
}

func (r *DockerRegistryReconcileTask) Run(req ctrl.Request) error {
	if err := r.LoadRegistry(req); err != nil {
		return client.IgnoreNotFound(err)
	}

	if err := r.LoadResources(req); err != nil {
		r.WarningEvent(err, "LoadResources error.")
		return err
	}

	if !r.registry.ObjectMeta.DeletionTimestamp.IsZero() {
		return nil
	}

	if err := r.UpdateStatus(); err != nil {
		r.WarningEvent(err, "UpdateStatus error.")
		return err
	}

	if err := r.DistributeSecrets(); err != nil {
		r.WarningEvent(err, "DistributeSecrets error.")
		return err
	}

	return nil
}

func (r *DockerRegistryReconcileTask) UpdateStatus() (err error) {
	var username, password string

	if r.secret != nil {
		username = string(r.secret.Data["username"])
		password = string(r.secret.Data["password"])
	}

	host := r.registry.Spec.Host

	if host == "" {
		host = "https://registry-1.docker.io"
	}

	_, err = registry.New(host, username, password)

	if err != nil {
		registryCopy := r.registry.DeepCopy()
		registryCopy.Status.AuthenticationVerified = false

		if err := r.Status().Patch(r.ctx, registryCopy, client.MergeFrom(r.registry)); err != nil {
			r.WarningEvent(err, "Patch docker registry status error.")
			return err
		}
		message := ""

		if r.secret == nil {
			message = fmt.Sprintf(
				"Registry Secret \"%s\" is not found in %s namespace. ",
				GetRegistryAuthenticationName(r.registry.Name),
				"kalm-system",
			)
		}

		message = message + err.Error()

		r.Recorder.Event(r.registry, v1.EventTypeWarning, "AuthFailed", message)
		return nil
	} else {
		registryCopy := r.registry.DeepCopy()
		registryCopy.Status.AuthenticationVerified = true

		if err := r.Status().Patch(r.ctx, registryCopy, client.MergeFrom(r.registry)); err != nil {
			r.WarningEvent(err, "Patch docker registry status error.")
			return err
		}
	}

	r.Recorder.Eventf(r.registry, v1.EventTypeNormal, "AuthSucceed", "Authenticate docker registry successfully.")
	return nil
}

func (r *DockerRegistryReconcileTask) DistributeSecrets() (err error) {
	if r.secret == nil {
		return nil
	}

	var nsList v1.NamespaceList
	if err := r.Reader.List(r.ctx, &nsList); err != nil {
		return err
	}

	for _, ns := range nsList.Items {
		if ns.DeletionTimestamp != nil {
			continue
		}

		if v, exist := ns.Labels[KalmEnableLabelName]; !exist || v != "true" {
			//todo clean secret if exist
			continue
		}

		var secret v1.Secret

		err := r.Reader.Get(r.ctx, types.NamespacedName{
			Name:      getImagePullSecretName(r.registry.Name),
			Namespace: ns.Name,
		}, &secret)

		if err != nil && !errors.IsNotFound(err) {
			r.WarningEvent(err, fmt.Sprintf("Get image pull secret error. Namespace: %s, registry: %s", ns.Name, r.registry.Name))
			return err
		}

		secret.Namespace = ns.Name
		secret.Name = getImagePullSecretName(r.registry.Name)
		secret.Type = v1.SecretTypeDockerConfigJson

		if secret.Data == nil {
			secret.Data = make(map[string][]byte)
		}

		if secret.Labels == nil {
			secret.Labels = make(map[string]string)
		}

		secret.Labels["kalm-docker-registry"] = r.registry.Name
		secret.Labels["kalm-docker-registry-image-pull-secret"] = "true"

		auth := r.secret.Data["username"]
		auth = append(auth, []byte(":")...)
		auth = append(auth, r.secret.Data["password"]...)

		var host = r.registry.Spec.Host

		if host == "" {
			host = "https://index.docker.io/v1/"
		}

		data := map[string]map[string]struct {
			Username string `json:"username"`
			Password string `json:"password"`
			Auth     string `json:"auth"`
		}{
			"auths": {
				host: {
					Username: string(r.secret.Data["username"]),
					Password: string(r.secret.Data["password"]),
					Auth:     base64.StdEncoding.EncodeToString(auth),
				},
			},
		}

		// Do not escape "<" or ">" or "&" char in data
		var bts bytes.Buffer
		encoder := json.NewEncoder(&bts)
		encoder.SetEscapeHTML(false)
		_ = encoder.Encode(data)

		secret.Data[".dockerconfigjson"] = bts.Bytes()

		if err := ctrl.SetControllerReference(r.registry, &secret, r.Scheme); err != nil {
			r.WarningEvent(err, "unable to set owner for secret")
			return err
		}

		if err != nil {
			if err := r.Client.Create(r.ctx, &secret); err != nil {
				r.WarningEvent(err, "Create secret failed. [distribute registry secret]")
				return err
			}

			return nil
		}

		if err := r.Client.Update(r.ctx, &secret); err != nil {
			r.WarningEvent(err, "Update secret failed. [distribute registry secret]")
			return err
		}
	}

	return nil
}

func getImagePullSecretName(registryName string) string {
	return fmt.Sprintf("%s-image-pull-secret", registryName)
}

func GetRegistryAuthenticationName(registryName string) string {
	return fmt.Sprintf("%s-authentication", registryName)
}

func GetRegistryNameFromAuthenticationName(secretName string) string {
	re := regexp.MustCompile(`-authentication$`)
	return re.ReplaceAllString(secretName, "")
}

func IsRegistryAuthenticationSecret(secret *v1.Secret) bool {
	return secret.Namespace == "kalm-system" && strings.HasSuffix(secret.Name, "-authentication")
}

func (r *DockerRegistryReconcileTask) LoadResources(req ctrl.Request) (err error) {
	var secret v1.Secret

	err = r.Reader.Get(r.ctx, types.NamespacedName{
		Namespace: "kalm-system",
		Name:      GetRegistryAuthenticationName(req.Name),
	}, &secret)

	if err != nil {
		return client.IgnoreNotFound(err)
	}

	secretCopy := secret.DeepCopy()

	if secretCopy.Labels == nil {
		secretCopy.Labels = make(map[string]string)
	}

	secretCopy.Labels["kalm-docker-registry-authentication"] = "true"

	if err := ctrl.SetControllerReference(r.registry, secretCopy, r.Scheme); err != nil {
		r.WarningEvent(err, "unable to set owner for secret")
		return err
	}

	if err := r.Patch(r.ctx, secretCopy, client.MergeFrom(&secret)); err != nil {
		r.WarningEvent(err, "Patch secret owner ref error.")
		return err
	}

	r.secret = &secret
	return
}

func (r *DockerRegistryReconcileTask) LoadRegistry(req ctrl.Request) (err error) {
	var registry corev1alpha1.DockerRegistry
	err = r.Reader.Get(r.ctx, req.NamespacedName, &registry)

	if err != nil {
		return err
	}

	r.registry = &registry

	return
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=dockerregistries,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=dockerregistries/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=core.kalm.dev,resources=applications,verbs=get;list
// +kubebuilder:rbac:groups="",resources=secrets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=events,verbs=create;patch

func (r *DockerRegistryReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	task := &DockerRegistryReconcileTask{
		DockerRegistryReconciler: r,
		ctx:                      context.Background(),
	}

	return ctrl.Result{}, task.Run(req)
}

type TouchAllRegistriesMapper struct {
	*BaseReconciler
}

func (m *TouchAllRegistriesMapper) Map(object handler.MapObject) []reconcile.Request {
	var rsList corev1alpha1.DockerRegistryList

	if err := m.Reader.List(context.Background(), &rsList); err != nil {
		return nil
	}

	res := make([]reconcile.Request, len(rsList.Items))

	for i, r := range rsList.Items {
		res[i] = reconcile.Request{
			NamespacedName: types.NamespacedName{
				Name: r.Name,
			},
		}
	}

	return res
}

type DockerRegistryAuthenticationSecretMapper struct {
	*BaseReconciler
}

func (m *DockerRegistryAuthenticationSecretMapper) Map(object handler.MapObject) []reconcile.Request {
	if secret, ok := object.Object.(*v1.Secret); ok && IsRegistryAuthenticationSecret(secret) {
		return []reconcile.Request{
			{NamespacedName: types.NamespacedName{Name: GetRegistryNameFromAuthenticationName(secret.Name)}},
		}
	} else {
		return nil
	}
}

func NewDockerRegistryReconciler(mgr ctrl.Manager) *DockerRegistryReconciler {
	return &DockerRegistryReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "DockerRegistry"),
	}
}

func (r *DockerRegistryReconciler) SetupWithManager(mgr ctrl.Manager) error {
	if err := mgr.GetFieldIndexer().IndexField(context.Background(), &v1.Secret{}, ownerKey, func(rawObj runtime.Object) []string {
		// grab the job object, extract the owner...
		secret := rawObj.(*v1.Secret)
		owner := metaV1.GetControllerOf(secret)
		if owner == nil {
			return nil
		}
		if owner.APIVersion != apiGVStr || owner.Kind != "DockerRegistry" {
			return nil
		}
		return []string{owner.Name}
	}); err != nil {
		return err
	}

	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.DockerRegistry{}).
		Watches(&source.Kind{Type: &v1.Secret{}}, &handler.EnqueueRequestsFromMapFunc{
			ToRequests: &DockerRegistryAuthenticationSecretMapper{r.BaseReconciler},
		}).
		Watches(
			&source.Kind{Type: &v1.Namespace{}},
			&handler.EnqueueRequestsFromMapFunc{
				ToRequests: &TouchAllRegistriesMapper{r.BaseReconciler},
			},
		).
		Owns(&v1.Secret{}).
		Complete(r)
}
