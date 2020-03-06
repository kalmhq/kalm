# kapp

## Dependencies

we support 2 dependencies for now:

1. kong-controller
2. cert-manager

You have to install them manually now:

```bash
# intall kong-controller, ref: https://github.com/Kong/kubernetes-ingress-controller#get-started
kubectl apply -f https://bit.ly/k4k8s

# install cert-manager, ref: https://cert-manager.io/docs/installation/kubernetes/#installing-with-regular-manifests
kubectl create namespace cert-manager

kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v0.13.1/cert-manager.yaml
```

