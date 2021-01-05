package controllers

import installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"

func (r *KalmOperatorConfigReconciler) reconcileSaaSMode(configSpec installv1alpha1.KalmOperatorConfigSpec) error {
	if err := r.reconcileKalmController(configSpec); err != nil {
		r.Log.Info("reconcileKalmController fail", "error", err)
		return err
	}

	if err := r.reconcileKalmDashboard(configSpec); err != nil {
		r.Log.Info("reconcileKalmDashboard fail", "error", err)
		return err
	}

	if err := r.reconcileDefaultTenantForSaaSMode(); err != nil {
		r.Log.Info("reconcileDefaultTenantForSaaSMode fail", "error", err)
		return err
	}

	saasModeConfig := configSpec.SaaSModeConfig

	baseDNSDomain := saasModeConfig.BaseDNSDomain
	if baseDNSDomain != "" {
		if err := r.reconcileACMEServer(baseDNSDomain); err != nil {
			r.Log.Info("reconcileACMEServer fail", "error", err)
			return err
		}
	}

	baseAppDomain := saasModeConfig.BaseAppDomain
	if baseAppDomain != "" {
		// baseDNSDomain exist -> ACMEServer ok -> so we can apply for wildcard cert
		// maybe a more strict check on kalmoperatorconfig for SaaS mode is a better way to simplify the logic
		applyForWildcardCert := baseDNSDomain != ""

		if err := r.reconcileHttpsCertForDomain(baseAppDomain, applyForWildcardCert); err != nil {
			r.Log.Info("reconcileHttpsCertForDomain fail", "error", err)
			return err
		}
	}

	if saasModeConfig != nil && saasModeConfig.CloudflareConfig != nil {
		if err := r.reconcileDNSRecords(configSpec); err != nil {
			r.Log.Info("reconcileDNSRecords fail", "error", err)
			return err
		}
	}

	if err := r.reconcileRootAccessTokenForSaaS(); err != nil {
		r.Log.Info("reconcileAccessTokenForSaaS fail", "error", err)
		return err
	}

	return nil
}
