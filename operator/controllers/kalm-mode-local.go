package controllers

import installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"

func (r *KalmOperatorConfigReconciler) reconcileLocalMode(configSpec installv1alpha1.KalmOperatorConfigSpec) error {
	if err := r.reconcileKalmController(configSpec); err != nil {
		r.Log.Info("reconcileKalmController fail", "error", err)
		return err
	}

	if err := r.reconcileKalmDashboard(configSpec); err != nil {
		r.Log.Info("reconcileKalmDashboard fail", "error", err)
		return err
	}

	return nil
}
