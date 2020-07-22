# Kalm - Kubernetes Application Manager

[![codecov](https://codecov.io/gh/kalmhq/kalm/branch/master/graph/badge.svg)](https://codecov.io/gh/kalmhq/kalm) [![CircleCI](https://circleci.com/gh/kalmhq/kalm.svg?style=svg)](https://circleci.com/gh/kalmhq/kalm) [![Go Report](https://goreportcard.com/badge/github.com/kalmhq/kalm)](https://goreportcard.com/badge/github.com/kalmhq/kalm)

Kalm is an easy way to manage applications on Kubernetes. Kalm provides a web UI for common workflows including creating and updating applications, scaling, routing, scheduling jobs, auto-healing, and setting up HTTPS certificates.

In addition, Kalm defines a set of CRDs that simplifies the underlying configuration and drastically reduces copy-pasting and boilerplate, as well as hooking up useful operators such as [cert-manager](https://cert-manager.io/docs/) and [istio](https://istio.io/).

![Kalm](https://kalm.dev/docs/assets/kalm.png)

Kalm is designed for developers and teams who want a simple and friendly interface for kubernetes without having to build and maintain internal tools.

## Install

Kalm is packaged as a [Kubernetes Operator](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/), and can be used with any Kubernetes cluster(minikube, GKE, EKS etc..)

See [detailed instructions](https://kalm.dev/docs/install#step-1-prerequisites) for installing `kubectl` and creating a `minikube` cluster on localhost.

If you already have access to a cluster via kubectl, deploy Kalm via:

```shell
curl -sL https://get.kalm.dev | bash
```

To check the installation status:

```
curl -sL https://raw.githubusercontent.com/kalmhq/kalm/master/scripts/check-kalm-install-status.sh | bash
```

The whole process typically takes up to 1-5 minutes. Relax or check out the <a href="https://kalm.dev/docs/intro." target="_blank">docs</a> in the mean time.

Once the installation is complete, open a port to the web server.

```
kubectl port-forward -n kalm-system $(kubectl get pod -n kalm-system -l app=kalm -ojsonpath="{.items[0].metadata.name}") 3001:3001
```

Kalm should now be accessible at [http://localhost:3001](http://localhost:3001). Refer to [these instructions](https://kalm.dev/docs/install#step-4-admin-service-account) on provisoning an access token and next steps.

## Docs & Guides

Detailed Documentation and Guides can be found at https://kalm.dev/docs/intro.

## License

[Apache License V2](LICENSE.txt)
