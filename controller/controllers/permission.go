package controllers

import (
	"fmt"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/api/rbac/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

func (r *ComponentReconcilerTask) getNameForPermission() string {
	name := fmt.Sprintf("kapp-permission-%s", r.component.Name)
	return name
}

func (r *ComponentReconcilerTask) reconcilePermission() error {
	if r.component == nil || r.component.Spec.RunnerPermission == nil {
		return nil
	}

	permission := r.component.Spec.RunnerPermission
	name := r.getNameForPermission()

	// serviceAccount
	var sa corev1.ServiceAccount
	err := r.Get(
		r.ctx,
		types.NamespacedName{Name: name, Namespace: r.component.Namespace},
		&sa)

	if errors.IsNotFound(err) {
		err := r.Create(r.ctx, &corev1.ServiceAccount{
			ObjectMeta: metav1.ObjectMeta{
				Name:      name,
				Namespace: r.component.Namespace,
			},
		})

		if err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	if permission.RoleType == "clusterRole" {
		// clusterRole
		desiredClusterRole := v1beta1.ClusterRole{
			ObjectMeta: metav1.ObjectMeta{Name: name},
			Rules:      permission.Rules,
		}

		var cr v1beta1.ClusterRole
		err := r.Get(r.ctx, types.NamespacedName{Name: name}, &cr)
		if errors.IsNotFound(err) {
			err := r.Create(r.ctx, &desiredClusterRole)
			if err != nil {
				return err
			}
		} else if err != nil {
			return err
		} else {
			// ensure
		}

		//binding
		desiredCRB := v1beta1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name: name,
			},
			RoleRef: v1beta1.RoleRef{
				APIGroup: v1beta1.GroupName,
				Kind:     "ClusterRole",
				Name:     name,
			},
			Subjects: []v1beta1.Subject{
				{
					Kind:      "ServiceAccount",
					Name:      name,
					Namespace: r.component.Namespace,
				},
			},
		}

		var crb v1beta1.ClusterRoleBinding
		err = r.Get(r.ctx, types.NamespacedName{Name: name}, &crb)
		if errors.IsNotFound(err) {
			if err := r.Create(r.ctx, &desiredCRB); err != nil {
				return err
			}
		} else if err != nil {
			return err
		} else {
			//todo ensure
		}
	} else {
		// role
		desiredRole := v1beta1.Role{
			ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: r.component.Namespace},
			Rules:      permission.Rules,
		}

		var cr v1beta1.Role
		err := r.Get(r.ctx, types.NamespacedName{Name: name, Namespace: r.component.Namespace}, &cr)
		if errors.IsNotFound(err) {
			err := r.Create(r.ctx, &desiredRole)
			if err != nil {
				return err
			}
		} else if err != nil {
			return err
		} else {
			// ensure
		}

		//binding
		desiredRB := v1beta1.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name:      name,
				Namespace: r.component.Namespace,
			},
			RoleRef: v1beta1.RoleRef{
				APIGroup: v1beta1.GroupName,
				Kind:     "Role",
				Name:     name,
			},
			Subjects: []v1beta1.Subject{
				{
					Kind:      "ServiceAccount",
					Name:      name,
					Namespace: r.component.Namespace,
				},
			},
		}

		var rb v1beta1.RoleBinding
		err = r.Get(r.ctx, types.NamespacedName{Name: name, Namespace: r.component.Namespace}, &rb)
		if errors.IsNotFound(err) {
			if err := r.Create(r.ctx, &desiredRB); err != nil {
				return err
			}
		} else if err != nil {
			return err
		} else {
			//todo ensure
		}
	}

	return nil
}
