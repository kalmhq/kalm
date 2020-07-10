gen-install-file:
	# operator yaml files
	kustomize build operator/config/default > kapp-install.yaml
	# append kappoperatorconfig to trigger install of:
	# - cert-manager
	# - istio
	# - kalm crd & rbac etc
	# - kalm controller & dashboard
	echo "---" >> kapp-install.yaml
	cat operator/config/samples/install_v1alpha1_kappoperatorconfig.yaml >> kapp-install.yaml
