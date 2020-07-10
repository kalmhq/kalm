# generate kapp-install.yaml
gen-install-file: prepare
	# operator yaml files
	kustomize build operator/config/default > kapp-install.yaml
	# append kappoperatorconfig to trigger install of:
	# - cert-manager
	# - istio
	# - kalm crd & rbac etc
	# - kalm controller & dashboard
	echo "---" >> kapp-install.yaml
	cat operator/config/samples/install_v1alpha1_kappoperatorconfig.yaml >> kapp-install.yaml

# delete kalm crd, operator, controller, dashboard
delete: prepare
	-kubectl delete -f kapp-install.yaml
	-kustomize build controller/config/default | kubectl delete -f -

# delete all kalm related things, including
#
# - istio
# - cert-manager
# - kalm operator and crds
# - kalm controller and crds
# - kalm dashboard
delete-all: delete
	-kubectl delete -f operator/resources/istiocontrolplane.yaml
	-kubectl delete -f operator/resources/cert-manager/cert-manager.yaml
	-kustomize build operator/resources/istio | kubectl delete -f -

prepare:
ifeq (, $(shell which kustomize))
        curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
        sudo mv ./kustomize /usr/local/bin/kustomize
endif
