
# Image URL to use all building/pushing image targets
IMG ?= ialaddin/kalm-controller:latest
# Produce CRDs that work back to Kubernetes 1.11 (no version conversion)
CRD_OPTIONS ?= "crd:trivialVersions=true"

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

all: manager

go-generate:
ifeq (, $(shell which go-bindata))
	go get -u github.com/go-bindata/go-bindata/...
endif
ifeq (, $(shell which kustomize))
	OSTYPE=linux
	curl -s "https://raw.githubusercontent.com/ialaddin/kalm/master/scripts/install-kustomize.sh" | bash
	sudo mv ./kustomize /usr/local/bin/kustomize
endif
	go generate ./...

# Run tests
test: generate fmt vet manifests go-generate
	go test ./... -coverprofile=coverage.txt -covermode=atomic -v

# Build manager binary
manager: generate fmt vet go-generate
	go build -o bin/manager main.go

# Run against the configured Kubernetes cluster in ~/.kube/config
run: generate fmt vet manifests go-generate
	go run main.go

dev: generate fmt vet manifests go-generate setup_webhook_development_env
	WEBHOOKS_CERTS_DIR=./tmp ENABLE_WEBHOOKS=true go run main.go

dev-local-mode: generate fmt vet manifests go-generate setup_webhook_development_env
	KALM_IS_IN_LOCAL_MODE=true WEBHOOKS_CERTS_DIR=./tmp ENABLE_WEBHOOKS=true go run main.go

# Install CRDs into a cluster
install: manifests
	kustomize build config/crd | kubectl apply -f -

setup_webhook_development_env:
	mkdir -p ./tmp
	openssl req -x509 -newkey rsa:4096 -keyout ./tmp/tls.key -out ./tmp/tls.crt -days 365 -nodes -subj '/CN=host.minikube.internal'
	kubectl kustomize config/webhook/ > ./tmp/kustomized-webhook-manifests.yaml
	ruby ./scripts/build-development-webhook-yaml.rb
	kubectl apply -f ./tmp/webhooks.yaml

# Uninstall CRDs from a cluster
uninstall: manifests
	kustomize build config/crd | kubectl delete -f -

# Deploy controller in the configured Kubernetes cluster in ~/.kube/config
deploy: manifests go-generate
	cd config/manager && kustomize edit set image controller=${IMG}
	kustomize build config/default | kubectl apply -f -

# Generate manifests e.g. CRD, RBAC etc.
manifests: controller-gen
	$(CONTROLLER_GEN) $(CRD_OPTIONS) rbac:roleName=controller webhook paths="./..." output:crd:artifacts:config=config/crd/bases
	make -C ../operator go-generate

manifests-for-operator: controller-gen
	$(CONTROLLER_GEN) $(CRD_OPTIONS) rbac:roleName=controller webhook paths="./..." output:crd:artifacts:config=config/crd/bases

# Run go fmt against code
fmt:
	go fmt ./...

# Run go vet against code
vet:
	go vet ./...

# Generate code
generate: controller-gen
	$(CONTROLLER_GEN) object:headerFile=./hack/boilerplate.go.txt paths="./..."

# Build the docker image
docker-build: generate fmt vet manifests go-generate
	docker build . -t ${IMG}

# Push the docker image
docker-push:
	docker push ${IMG}


# find or download controller-gen
# download controller-gen if necessary
controller-gen:
ifeq (, $(shell which controller-gen))
	@{ \
	set -e ;\
	CONTROLLER_GEN_TMP_DIR=$$(mktemp -d) ;\
	cd $$CONTROLLER_GEN_TMP_DIR ;\
	go mod init tmp ;\
	go get sigs.k8s.io/controller-tools/cmd/controller-gen@v0.2.4 ;\
	rm -rf $$CONTROLLER_GEN_TMP_DIR ;\
	}
CONTROLLER_GEN=$(GOBIN)/controller-gen
else
CONTROLLER_GEN=$(shell which controller-gen)
endif
