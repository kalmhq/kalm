package controllers

import installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"

func (r *KalmOperatorConfigReconciler) reconcileBYOCMode(configSpec installv1alpha1.KalmOperatorConfigSpec) error {
	if err := r.reconcileKalmController(configSpec); err != nil {
		r.Log.Info("reconcileKalmController fail", "error", err)
		return err
	}

	if err := r.reconcileDefaultTenantForBYOCMode(); err != nil {
		r.Log.Info("reconcileDefaultTenantForSaaSMode fail", "error", err)
		return err
	}

	if err := r.reconcileKalmDashboard(configSpec); err != nil {
		r.Log.Info("reconcileKalmDashboard fail", "error", err)
		return err
	}

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

	return nil
}
