package controllers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *KalmOperatorConfigReconciler) reconcileBYOCMode() error {

	// if _, err := r.updateInstallProcess(installv1alpha1.InstallStateInstallingKalm); err != nil {
	// 	return err
	// }

	if err := r.reconcileKalmController(); err != nil {
		r.Log.Info("reconcileKalmController fail", "error", err)
		return err
	}

	if err := r.reconcileKalmDashboard(); err != nil {
		r.Log.Info("reconcileKalmDashboard fail", "error", err)
		return err
	}

	configSpec := r.config.Spec
	byocModeConfig := configSpec.BYOCModeConfig

	baseDNSDomain := byocModeConfig.BaseDNSDomain
	if baseDNSDomain != "" {
		if err := r.reconcileACMEServer(baseDNSDomain); err != nil {
			r.Log.Info("reconcileACMEServer fail", "error", err)
			return err
		}
	}

	baseAppDomain := byocModeConfig.BaseAppDomain
	if baseAppDomain != "" {
		applyForWildcardCert := baseDNSDomain != ""

		if err := r.reconcileHttpsCertForDomain(baseAppDomain, applyForWildcardCert); err != nil {
			r.Log.Info("reconcileHttpsCertForDomain fail", "error", err)
			return err
		}
	}

	if err := r.reconcileRootAccessTokenForBYOC(); err != nil {
		r.Log.Info("reconcileRootAccessTokenForBYOC fail", "error", err)
		return err
	}

	if err := r.reconcileRoleBindingForOwner(byocModeConfig.Owner); err != nil {
		r.Log.Info("reconcileRoleBindingForOwner fail", "error", err)
		return err
	}

	if err := r.ReloadConfig(); err != nil {
		return err
	}

	status := r.config.Status
	shouldReportClusterInfo := status.BYOCModeStatus == nil || !status.BYOCModeStatus.ClusterInfoHasSendToKalmSaaS

	if shouldReportClusterInfo {
		clusterInfo, ready := r.getClusterInfoIfIsReady(byocModeConfig)
		if !ready {
			r.Log.Info("BYOC cluster not ready yet, will wait...", "clusterInfo", clusterInfo)
			// return retryLaterErr
			return nil
		}

		// post cluster info to kalm-SaaS
		if ok, err := r.reportClusterInfoToKalmSaaS(clusterInfo, byocModeConfig.KalmSaaSDomain, byocModeConfig.ClusterUUID); err != nil {
			r.Log.Error(err, "reportClusterInfoToKalmSaaS failed")
			return err
		} else if !ok {
			r.Log.Info("fail to report BYOC cluster info to Kalm-SaaS, will retry later...")
			return nil
		}

		if status.BYOCModeStatus == nil {
			r.config.Status.BYOCModeStatus = &installv1alpha1.BYOCModeStatus{}
		}
		r.config.Status.BYOCModeStatus.ClusterInfoHasSendToKalmSaaS = true

		return r.Status().Update(r.Ctx, r.config)
	} else {
		r.Log.Info("ClusterInfo already reported")
	}

	return nil
}

type ClusterInfo struct {
	ClusterIP         string `json:"cluster_ip,omitempty"`
	ClusterHost       string `json:"cluster_host,omitempty"`
	ACMEServerIP      string `json:"acme_server_ip,omitempty"`
	ACMEServerHost    string `json:"acme_server_host,omitempty"`
	ACMEDomainForApps string `json:"acme_domain_for_apps,omitempty"`
	AccessToken       string `json:"access_token,omitempty"`
	CallbackSecret    string `json:"callback_secret,omitempty"`
}

func (r *KalmOperatorConfigReconciler) getClusterInfoIfIsReady(byocModeConfig *installv1alpha1.BYOCModeConfig) (ClusterInfo, bool) {
	callbackSecret, _ := r.getCallbackSecret()
	clusterIP, clusterHost := r.getClusterIPAndHostname()
	acmeServerIP, acmeServerHostname := r.getACMEServerIPAndHostname()
	domain, _ := r.getACMEDomainForApps(byocModeConfig.BaseAppDomain)
	accessToken, _ := r.getRootAccessToken()

	isReady := (clusterIP != "" || clusterHost != "") &&
		(acmeServerIP != "" || acmeServerHostname != "") &&
		domain != "" &&
		accessToken != "" &&
		callbackSecret != ""

	info := ClusterInfo{
		ClusterIP:         clusterIP,
		ClusterHost:       clusterHost,
		ACMEServerIP:      acmeServerIP,
		ACMEServerHost:    acmeServerHostname,
		ACMEDomainForApps: domain,
		AccessToken:       accessToken,
		CallbackSecret:    callbackSecret,
	}

	return info, isReady
}

func (r *KalmOperatorConfigReconciler) reportClusterInfoToKalmSaaS(clusterInfo ClusterInfo, kalmSaaSDomain string, uuid string) (bool, error) {

	kalmSaaSAPI := fmt.Sprintf("https://%s/api/v1/clusters/%s", kalmSaaSDomain, uuid)
	payload, _ := json.Marshal(clusterInfo)

	r.Log.Info("reportClusterInfoToKalmSaaS", "api", kalmSaaSAPI, "payload", string(payload))

	resp, err := http.Post(kalmSaaSAPI, "application/json; charset=UTF-8", bytes.NewReader(payload))
	if err != nil {
		r.Log.Info("error when reportClusterInfoToKalmSaaS", "error", err)
		return false, err
	}

	// deal with cluster already inited
	if resp.StatusCode == 400 {
		body, err := ioutil.ReadAll(resp.Body)
		if err == nil && strings.Contains(string(body), "cluster is already initialized") {
			return true, nil
		}
	}

	if resp.StatusCode != 200 {
		r.Log.Info("reportClusterInfoToKalmSaaS failed", "resp", resp.Body, "status", resp.StatusCode)
		return false, nil
	}

	return true, nil
}

func (r *KalmOperatorConfigReconciler) updateInstallProcess() (updated bool, err error) {
	if r.config.Status.InstallStatusKey != nil &&
		*r.config.Status.InstallStatusKey == installv1alpha1.InstallStateDone {
		return false, nil
	}

	var stateIdx int

	var installStates []installv1alpha1.InstallState
	if r.config.Spec.BYOCModeConfig != nil {
		installStates = installv1alpha1.InstallStatesForBYOC
	} else {
		installStates = installv1alpha1.InstallStatesForLocal
	}

	for ; stateIdx < len(installStates); stateIdx++ {
		state := installStates[stateIdx]

		if state.Key == installv1alpha1.InstallStateStart {
			continue
		}

		if state.Key == installv1alpha1.InstallStateInstalCertMgr {
			if !r.isCertManagerReady() {
				break
			}
		}

		if state.Key == installv1alpha1.InstallStateInstalIstio {
			if !r.isIstioReady() {
				break
			}
		}

		if state.Key == installv1alpha1.InstallStateInstalKalmController &&
			!r.isKalmControllerReady() {
			break
		}

		if state.Key == installv1alpha1.InstallStateInstalKalmDashboard {
			if !r.isKalmDashboardReady() {
				break
			}
		}

		if state.Key == installv1alpha1.InstallStateInstalACMEServer {
			if !r.isACMEServerReady() {
				break
			}
		}

		if state.Key == installv1alpha1.InstallStateConfigureKalmDashboardAccess {
			if !r.isKalmDashboardAccessReady() {
				break
			}
		}
		if state.Key == installv1alpha1.InstallStateConfigureACMEServerAccess {
			if !r.isACMEServerAccessReady() {
				break
			}
		}

		if state.Key == installv1alpha1.InstallStateReportClusterInfo {
			if !r.isClusterInfoReported() {
				break
			}
		}

		if r.config.Spec.BYOCModeConfig != nil &&
			state.Key == installv1alpha1.InstallStateClusterFullySetup {

			ok, err := r.isBYOCModeFullySetup()
			if err != nil || !ok {
				break
			}
		}

		//final state
		if state.Key == installv1alpha1.InstallStateDone {
			break
		}
	}

	config := r.config.DeepCopy()

	// curStatusKey := config.Status.InstallStatusKey
	newStatus := installStates[stateIdx]
	newStatusKey := newStatus.Key

	// setup status.installConditions
	newInstallConditions := []installv1alpha1.InstallCondition{}
	for i, state := range installStates {
		var s corev1.ConditionStatus
		isReady := i < stateIdx || stateIdx == len(installStates)-1
		if isReady {
			s = corev1.ConditionTrue
		} else {
			s = corev1.ConditionFalse
		}

		newCondition := installv1alpha1.InstallCondition{
			Type:   state.Key,
			Status: s,
		}

		oldCondition := findConditionByKey(state.Key, config.Status.InstallConditions)

		if oldCondition != nil && oldCondition.LastTransitionTime != nil && oldCondition.Status == newCondition.Status {
			newCondition.LastTransitionTime = oldCondition.LastTransitionTime
		} else {
			now := metav1.NewTime(time.Now())
			newCondition.LastTransitionTime = &now
		}

		//check if timeout
		if newCondition.Status == corev1.ConditionFalse && i <= stateIdx {
			secondsElapse := time.Now().Unix() - newCondition.LastTransitionTime.Unix()
			if secondsElapse > int64(state.Timeout.Seconds()) {
				newCondition.Reason = "Timeout"
				newCondition.Message = state.TimeoutHint

				possibleReasons := r.getPossibleReasonsForTimeout(newCondition.Type)
				newCondition.Message += fmt.Sprintf(" %s", possibleReasons)
			}
		}

		newInstallConditions = append(newInstallConditions, newCondition)
	}

	config.Status.InstallConditions = newInstallConditions
	config.Status.InstallStatusKey = &newStatusKey

	if config.Spec.BYOCModeConfig != nil {
		ok, err := r.reportInstallProcessToKalmSaaS(newStatusKey)

		// only deal with failure for final state: INSTALLED
		// cuz if this missed, SaaS will be in wrong state
		// failure in other states can be ignored
		if newStatusKey == installv1alpha1.InstallStateDone {
			if err != nil {
				return false, err
			} else if !ok {
				return false, fmt.Errorf("reportInstallProcessToKalmSaaS failed for status: %s", newStatusKey)
			}
		}
	}

	// update to new install status
	if err := r.Status().Update(r.Ctx, config); err != nil {
		return false, err
	}

	return true, nil
}

func findConditionByKey(key installv1alpha1.InstallStatusKey, conditions []installv1alpha1.InstallCondition) *installv1alpha1.InstallCondition {
	for i := range conditions {
		cond := conditions[i]
		if cond.Type != key {
			continue
		}

		return &cond
	}

	return nil
}

// func indexOfStatus(key installv1alpha1.InstallStatusKey) int {
// 	for i, state := range installv1alpha1.InstallStates {
// 		if key == state.Key {
// 			return i
// 		}
// 	}

// 	return -1
// }

type InstallProgress struct {
	State             installv1alpha1.InstallStatusKey   `json:"state,omitempty"`
	CallbackSecret    string                             `json:"callback_secret,omitempty"`
	IsTimeout         bool                               `json:"is_timeout,omitempty"`
	Message           string                             `json:"message,omitempty"`
	InstallConditions []installv1alpha1.InstallCondition `json:"install_conditions,omitempty"`
}

func (r *KalmOperatorConfigReconciler) reportInstallProcessToKalmSaaS(state installv1alpha1.InstallStatusKey) (bool, error) {
	if r.config == nil || r.config.Spec.BYOCModeConfig == nil {
		return false, fmt.Errorf("not KalmOperatorConfig or BYOCConfig found")
	}

	kalmSaaSDomain := r.config.Spec.BYOCModeConfig.KalmSaaSDomain
	uuid := r.config.Spec.BYOCModeConfig.ClusterUUID

	callbackSecret, _ := r.getCallbackSecret()

	kalmSaaSAPI := fmt.Sprintf("https://%s/api/v1/clusters/%s", kalmSaaSDomain, uuid)

	isTimeout := false
	msg := ""

	for i, cond := range r.config.Status.InstallConditions {
		if cond.Status != corev1.ConditionFalse {
			continue
		}

		firstStuckCond := r.config.Status.InstallConditions[i]
		isTimeout = firstStuckCond.Reason == "Timeout"
		msg = firstStuckCond.Message

		break
	}

	payload := InstallProgress{
		State:             state,
		CallbackSecret:    callbackSecret,
		IsTimeout:         isTimeout,
		Message:           msg,
		InstallConditions: r.config.Status.InstallConditions,
	}
	payloadJson, _ := json.Marshal(payload)

	r.Log.Info("reportInstallProcessToKalmSaaS", "api", kalmSaaSAPI, "payload", string(payloadJson))

	client := &http.Client{}

	req, err := http.NewRequest(http.MethodPut, kalmSaaSAPI, bytes.NewBuffer(payloadJson))
	if err != nil {
		return false, err
	}
	req.Header.Set("Content-Type", "application/json; charset=utf-8")

	resp, err := client.Do(req)
	if err != nil {
		r.Log.Info("err when client.Do in reportInstallProcessToKalmSaaS", "err", err)
		return false, err
	}

	if resp.StatusCode != 200 {
		r.Log.Info("reportInstallProcessToKalmSaaS failed", "resp", resp.Body, "status", resp.StatusCode)
		return false, nil
	}

	r.Log.Info("reportInstallProcessToKalmSaaS ok", "resp", resp.Body, "status", resp.StatusCode)

	return true, nil
}

// currently only check if HttpsCert for dashboard is ready
// this is the most time consuming task, usually finished last
func (r *KalmOperatorConfigReconciler) isBYOCModeFullySetup() (bool, error) {
	var httpsCert v1alpha1.HttpsCert

	objKey := client.ObjectKey{Name: HttpsCertNameDashboard}
	if err := r.Get(r.Ctx, objKey, &httpsCert); err != nil {
		if errors.IsNotFound(err) {
			return false, nil
		}

		return false, err
	}

	for _, cond := range httpsCert.Status.Conditions {
		if cond.Type != v1alpha1.HttpsCertConditionReady {
			continue
		}

		if cond.Status != corev1.ConditionTrue {
			continue
		}

		return true, nil
	}

	return false, nil
}

func (r *KalmOperatorConfigReconciler) getACMEDomainForApps(appsDomain string) (string, error) {
	certList := v1alpha1.HttpsCertList{}
	if err := r.List(r.Ctx, &certList); err != nil {
		return "", err
	}

	for _, cert := range certList.Items {
		for _, domain := range cert.Spec.Domains {
			if domain != appsDomain {
				continue
			}

			if cert.Status.WildcardCertDNSChallengeDomainMap == nil {
				continue
			}

			return cert.Status.WildcardCertDNSChallengeDomainMap[appsDomain], nil
		}
	}

	return "", nil
}

func (r *KalmOperatorConfigReconciler) getRootAccessToken() (string, error) {
	accessTokenList := v1alpha1.AccessTokenList{}

	filter := client.MatchingLabels(map[string]string{rootAccessTokenLabel: "true"})

	if err := r.List(r.Ctx, &accessTokenList, filter); err != nil {
		return "", err
	}

	if len(accessTokenList.Items) <= 0 {
		return "", fmt.Errorf("expected rootAccessToken not exist")
	}

	token := accessTokenList.Items[0]
	return token.Spec.Token, nil
}

func (r *KalmOperatorConfigReconciler) getCallbackSecret() (string, error) {
	ns := "kalm-operator"
	secName := "kalm-saas-token"

	sec := corev1.Secret{}
	if err := r.Get(r.Ctx, client.ObjectKey{Namespace: ns, Name: secName}, &sec); err != nil {
		return "", err
	}

	data := sec.Data["TOKEN"]
	return string(data), nil
	// return parseBase64EncodedString(data)
}

func parseBase64EncodedString(data []byte) (string, error) {
	decoded, err := base64.StdEncoding.DecodeString(string(data))
	if err != nil {
		return "", err
	}

	return string(decoded), nil
}
