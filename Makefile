# generate kalm-install.yaml
gen-install-file: prepare
	# operator yaml files
	kustomize build operator/config/default > kalm-install-operator.yaml
	# append kalmoperatorconfig to trigger install of:
	# - cert-manager
	# - istio
	# - kalm crd & rbac etc
	# - kalm controller & dashboard
	cat operator/config/samples/install_v1alpha1_kalmoperatorconfig.yaml > kalm-install-kalmoperatorconfig.yaml

# delete kalm crd, operator, controller, dashboard
delete: prepare
	-kubectl delete -f kalm-install-kalmoperatorconfig.yaml
	-kubectl delete -f kalm-install-operator.yaml
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
