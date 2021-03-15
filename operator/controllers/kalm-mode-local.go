package controllers

func (r *KalmOperatorConfigReconciler) reconcileLocalMode() error {

	if err := r.reconcileKalmController(); err != nil {
		r.Log.Info("reconcileKalmController fail", "error", err)
		return err
	}

	if err := r.reconcileKalmDashboard(); err != nil {
		r.Log.Info("reconcileKalmDashboard fail", "error", err)
		return err
	}

	return nil
}
