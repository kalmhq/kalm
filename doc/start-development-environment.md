# Setup development environment

1. start localhost k8s cluster

```bash
minikube start --memory 8192 --cpus 4  --kubernetes-version v1.15.0
minikube addons enable metrics-server
```

2. Install CRD and Start Controller

```bash
cd controller
make install
make run
```

> This step is **optional**. You can find some samples in config/samples dir. Choose the ones you need then install them.

```bash
kubectl apply -f config/samples/___.yaml
```
3. install istio

```bash
# go to a dir which you want to install istioctl in
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.5.2 sh -

# enter istio dir
cd istio-1.5.2

# export binary path
export PATH=$PWD/bin:$PATH

# install operator. operator is a k8s crd controller.
istioctl operator init

# Outputs:
#
# Using operator Deployment image: docker.io/istio/operator:1.5.2
# - Applying manifest for component Operator...
# ✔ Finished applying manifest for component Operator.
# Component Operator installed successfully.
# *** Success. ***

# check status by running the following command. Wait the pod to become ready.
# This state may last for a few minutes based on your network.
kubectl get pods -n istio-operator
```

launch istio in our cluster

```bash
# go to kapp root dir, install istio config. The operator will intall istio components for us.
kubectl apply -f resources/istiocontrolplane.yaml

# check istio components status
kubectl get pods -n istio-system

# You should be able see the following pods up and running.
# NAME                                    READY   STATUS    RESTARTS   AGE
# istio-ingressgateway-6d5cfb5dcb-n4xbz   1/1     Running   0          9h
# istiod-768488f855-vt8d7                 1/1     Running   0          9h
# kiali-7ff568c949-ql8dc                  1/1     Running   0          5h10m
# prometheus-fd997976c-qzqr5              2/2     Running   0          9h
```
4. Start Api Server

```bash
cd api
go run .
```

5. Start frontend

```bash
cd frontend

# before start, copy .env.sample to .env, then edit .env

npm install
npm run start
```

before you start, you need to apply a token for authorization. If you already have token you can skip this step. Otherwise, please follow [Create test service account](./create-test-service-account.md) to get a token.

You should login with this token on login page.

6. test kapp hipster

```bash

kubectl apply -f controller/config/samples/core_v1alpha1_application-hipster.yaml

kubectl port-forward $(kubectl get pod -n kapp-hipster -l kapp-component=frontend  -o jsonpath='{.items[0].metadata.name}') -n kapp-hipster 8080:8080

view http://localhost:8080
```
