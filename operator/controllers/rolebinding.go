package controllers

import (
	"crypto/md5"
	"fmt"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *KalmOperatorConfigReconciler) reconcileRoleBindingForOwner(owner string) error {
	if owner == "" {
		r.Log.Info("owner is empty, reconcileRoleBindingForOwner skipped")
		return nil
	}

	rolebindingName := fmt.Sprintf("default-cluster-owner-%x", md5.Sum([]byte(owner)))

	expectedRoleBinding := v1alpha1.RoleBinding{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: v1alpha1.KalmSystemNamespace,
			Name:      rolebindingName,
		},
		Spec: v1alpha1.RoleBindingSpec{
			Subject:     owner,
			SubjectType: "user",
			Role:        v1alpha1.ClusterRoleOwner,
			Creator:     "kalm-operator",
		},
	}

	var roleBinding v1alpha1.RoleBinding
	objKey := client.ObjectKey{
		Namespace: expectedRoleBinding.Namespace,
		Name:      expectedRoleBinding.Name,
	}

	isNew := false
	if err := r.Get(r.Ctx, objKey, &roleBinding); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		isNew = true
	}

	if isNew {
		roleBinding = expectedRoleBinding
		return r.Create(r.Ctx, &roleBinding)
	} else {
		roleBinding.Spec = expectedRoleBinding.Spec
		return r.Update(r.Ctx, &roleBinding)
	}
}
