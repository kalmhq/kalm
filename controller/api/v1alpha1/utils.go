package v1alpha1

import (
	v1 "k8s.io/api/core/v1"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
)

var utillog = logf.Log.WithName("v1alpha1-utils")

func IsNamespaceKalmEnabled(namespace v1.Namespace) bool {
	if v, exist := namespace.Labels[KalmEnableLabelName]; !exist || v != KalmEnableLabelValue {
		return false
	}

	return true
}
