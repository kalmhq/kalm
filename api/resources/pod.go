package resources

import (
	coreV1 "k8s.io/api/core/v1"
)


// getPodStatusPhase returns one of four pod status phases (Pending, Running, Succeeded, Failed)
func getPodStatusPhase(pod coreV1.Pod, warnings []coreV1.Event) coreV1.PodPhase {
	// For terminated pods that failed
	if pod.Status.Phase == coreV1.PodFailed {
		return coreV1.PodFailed
	}

	// For successfully terminated pods
	if pod.Status.Phase == coreV1.PodSucceeded {
		return coreV1.PodSucceeded
	}

	ready := false
	initialized := false
	for _, c := range pod.Status.Conditions {
		if c.Type == coreV1.PodReady {
			ready = c.Status == coreV1.ConditionTrue
		}
		if c.Type == coreV1.PodInitialized {
			initialized = c.Status == coreV1.ConditionTrue
		}
	}

	if initialized && ready && pod.Status.Phase == coreV1.PodRunning {
		return coreV1.PodRunning
	}

	// If the pod would otherwise be pending but has warning then label it as
	// failed and show and error to the user.
	if len(warnings) > 0 {
		return coreV1.PodFailed
	}

	// pending
	return coreV1.PodPending
}
