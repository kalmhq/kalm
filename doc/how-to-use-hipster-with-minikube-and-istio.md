# Install cluster

install minikube and start a cluster.

```bash
# adjust memory and cpus based on your computes
minikube start --memory 8192 --cpus 4  --kubernetes-version v1.15.0
```

# Install istioctl

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
# go to kalm root dir, install istio config. The operator will install istio components for us.
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

# Install kalm controller

```bash
# go to kalm controller dir
make install
make run

# This terminal will continue to run the controller.
```

Start another terminal and continue.

# Install hipster application

```bash
# go to kalm controller dir
kubectl apply -f config/samples/core_v1alpha1_hipster.yaml

# check istio components status
kubectl get pods -n kalm-hipster

# You will see 12 pods. There will be 2 containers in each pod. (READY 2/2 means the pod has 2 ready containers).
```

# Some commands to view the status

This step is view status only. The following commands are very helpful for understanding the entire program.

```bash
# view istio settings of a pod

istioctl x describe pod -n kalm-hipster $(kubectl get pods -n kalm-hipster -l kalm-component=frontend -o jsonpath='{.items[0].metadata.name}')
```

```bash
# view istio sidecar iptable rules of a pod

kubectl logs $(kubectl get pods -n kalm-hipster -l kalm-component=frontend -o jsonpath='{.items[0].metadata.name}') -n kalm-hipster -c istio-init
```

```bash
# istio proxy status
istioctl proxy-status
```

```bash
# istio proxy-config of a pod
istioctl proxy-config cluster -n kalm-hipster $(kubectl get pods -n kalm-hipster -l kalm-component=frontend -o jsonpath='{.items[0].metadata.name}')

# istioctl proxy-config -h for more available commands
```

```bash
# get minikube ip
minikube ip

# 192.168.64.30
```

```bash
# get istio default ingress gateway ip
kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}'
```

```bash
# view istio settings

kubectl get sidecars -A
kubectl get virtualservices -A
kubectl get gateways -A
kubectl get destinationrules -A
```

# Access hipster services from outside of the custer

```bash
# start a minikube tunnel. Run the following command in a new terminal. The terminal will be blocked by tunnel process. May require you to enter your password.

minikube tunnel
```

```bash
ISTIO_GATEWAY_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
echo "http://$(minikube ip):$ISTIO_GATEWAY_PORT"

# in my compouter the output is
# http://192.168.64.30:31593

# open the address in a browser.
```

# Access istio kiali dashboard

```bash
# Run this command in a new terminal.

istioctl dashboard kiali

# go to graph page
# select kalm-hipster namespace
# make kalm-hipster requests from browser and view graph changes
```

# test HTTPS certificate at localhost

```shell
# 1. prepare env
SECURE_INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="https")].nodePort}')
INGRESS_HOST=$(minikube ip)

# 2. curl svc with `--insecure`
curl -v --insecure -HHost:hipster.demo.com --resolve hipster.demo.com:$SECURE_INGRESS_PORT:$INGRESS_HOST \
https://hipster.demo.com:$SECURE_INGRESS_PORT/

# 3. get root crt of our CA
kubectl get secret -n cert-manager https-cert-issuer-hipster -o jsonpath='{.data.tls\.crt}' | base64 -D > ca.crt

# 4. curl with `--cacrt ca.crt` to trust our CA, you should see the HTTPS request succeed now
curl -v -HHost:hipster.demo.com --resolve hipster.demo.com:$SECURE_INGRESS_PORT:$INGRESS_HOST \
--cacert ca.crt https://hipster.demo.com:$SECURE_INGRESS_PORT/
```

