package controllers

import (
	"fmt"
	"strings"

	installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *KalmOperatorConfigReconciler) getPossibleReasonsForTimeout(statusKey installv1alpha1.InstallStatusKey) string {
	switch statusKey {
	case installv1alpha1.InstallStateInstalCertMgr:
		return r.getAbnormalInfoForCertManager()
	case installv1alpha1.InstallStateInstalIstio:
		return r.getAbnormalInfoForIstio()
	case installv1alpha1.InstallStateInstalKalmController:
		return r.getAbnormalInfoForKalmController()
	case installv1alpha1.InstallStateInstalKalmDashboard:
		return r.getAbnormalInfoForKalmDashboard()
	case installv1alpha1.InstallStateInstalACMEServer:
		return r.getAbnormalInfoForACMEServer()
		//todo more
	}

	return ""
}

func (r *KalmOperatorConfigReconciler) getAbnormalInfoForCertManager() string {
	dpNames := []string{"cert-manager", "cert-manager-cainjector", "cert-manager-webhook"}

	notReadyDPs := r.getNotReadyDPsInNS(dpNames, "cert-manager")

	if len(notReadyDPs) == 0 {
		return ""
	}

	return "Following Deployments are still installing:" + strings.Join(notReadyDPs, ",")
}

func (r *KalmOperatorConfigReconciler) getAbnormalInfoForIstio() string {

	var ctrlPlaneMsg string

	notReadyOpDPs := r.getNotReadyDPsInNS([]string{"istio-operator"}, "istio-operator")
	if len(notReadyOpDPs) > 0 {
		ctrlPlaneMsg = "In namespace: istio-operator, Deployments are still installing:" + strings.Join(notReadyOpDPs, ",")
	}

	var workPlaneMsg string

	notReadyDPs := r.getNotReadyDPsInNS([]string{"istio-ingressgateway", "istiod", "prometheus"}, "istio-system")
	if len(notReadyDPs) == 0 {
		workPlaneMsg = "In namespace: istio-system, Deployments are still installing:" + strings.Join(notReadyDPs, ",")
	}

	return strings.Join([]string{ctrlPlaneMsg, workPlaneMsg}, ",")
}

func (r *KalmOperatorConfigReconciler) getAbnormalInfoForKalmController() string {
	abnormalConditions := r.getAbnormalDPConditions("kalm-controller", "kalm-system")

	if len(abnormalConditions) == 0 {
		return ""
	}

	return strings.Join(abnormalConditions, ",")
}

func (r *KalmOperatorConfigReconciler) getAbnormalInfoForKalmDashboard() string {
	abnormalConditions := r.getAbnormalDPConditions("kalm", "kalm-system")

	if len(abnormalConditions) == 0 {
		return ""
	}

	return strings.Join(abnormalConditions, ",")
}

func (r *KalmOperatorConfigReconciler) getAbnormalInfoForACMEServer() string {
	abnormalConditions := r.getAbnormalDPConditions("acme-server", "kalm-system")

	if len(abnormalConditions) == 0 {
		return ""
	}

	return strings.Join(abnormalConditions, ",")
}

func (r *KalmOperatorConfigReconciler) getNotReadyDPsInNS(dpNames []string, ns string) []string {
	notReadyDPs := []string{}

	for _, dp := range dpNames {
		if !r.isDPReady(dp, ns) {
			notReadyDPs = append(notReadyDPs, dp)
		}
	}

	return notReadyDPs
}

// https://github.com/kubernetes/kubernetes/blob/a185bafa0c9142779a00fe7d3ba60726d04688c6/pkg/apis/apps/types.go#L458
func (r *KalmOperatorConfigReconciler) getAbnormalDPConditions(dpName string, ns string) []string {
	var rst []string

	normalConditions := [][]string{
		[]string{"Progressing", string(corev1.ConditionTrue)},
		[]string{"Available", string(corev1.ConditionTrue)},
		[]string{"ReplicaFailure", string(corev1.ConditionFalse)},
	}

	var dp appsv1.Deployment
	if err := r.Get(r.Ctx, client.ObjectKey{Namespace: ns, Name: dpName}, &dp); err != nil {
		return nil
	}

	for _, cond := range dp.Status.Conditions {
		for _, normalCond := range normalConditions {
			if normalCond[0] != string(cond.Type) {
				continue
			}

			if normalCond[1] != string(cond.Status) {
				rst = append(rst, fmt.Sprintf("%s, %s"), cond.Reason, cond.Message)
			}
		}
	}

	return rst
}

func (r *KalmOperatorConfigReconciler) isDPReady(dpName, ns string) bool {
	var dp appsv1.Deployment
	if err := r.Get(r.Ctx, client.ObjectKey{Namespace: ns, Name: dpName}, &dp); err != nil {
		return false
	}

	return dp.Status.ReadyReplicas >= dp.Status.Replicas
}
