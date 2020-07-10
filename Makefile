gen-install-file:
	kustomize build operator/config/default > kapp-install.yaml
	echo "---" >> kapp-install.yaml
	cat operator/config/samples/install_v1alpha1_kappoperatorconfig.yaml >> kapp-install.yaml
