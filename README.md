# Kalm - Kubernetes Application Manager

[![codecov](https://codecov.io/gh/kalmhq/kalm/branch/master/graph/badge.svg)](https://codecov.io/gh/kalmhq/kalm) [![CircleCI](https://circleci.com/gh/kalmhq/kalm.svg?style=svg)](https://circleci.com/gh/kalmhq/kalm) [![Go Report](https://goreportcard.com/badge/github.com/kalmhq/kalm)](https://goreportcard.com/badge/github.com/kalmhq/kalm)

Kalm is an easy way to manage applications on Kubernetes. Kalm's web UI simplifies the most common workflows: creating and updating application components, scaling, routing, scheduling jobs, auto-healing, setting up HTTPS certificates, and more.

![Kalm](https://kalm.dev/docs/assets/kalm.png)

## Install

Kalm is packaged as a [Kubernetes Operator](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/), and can be used with any Kubernetes cluster(minikube, GKE, EKS etc..)

See instructions for creating a minikube cluster on localhost.

Once you have a properly configured cluster and kubectl installed, deploy Kalm with:

```shell
curl -sL https://get.kalm.dev | bash
```

To check the installation status:

```
curl -sL https://raw.githubusercontent.com/kalmhq/kalm/master/scripts/check-kalm-install-status.sh | bash
```

The whole process typically takes up to 1-5 minutes. Relax or read the docs in the mean time.

Once the installation is complete, open a port to the web server:

```
kubectl port-forward -n kalm-system $(kubectl get pod -n kalm-system -l app=kalm -ojsonpath="{.items[0].metadata.name}") 3001:3001
```

Kalm should now be accessible at [http://localhost:3001](http://localhost:3001). Refer to [these instructions](https://kalm.dev/docs/install#step-4-admin-service-account) on provisoning an access token.

## Docs & Guides

Detailed Documentation and Guides can be found at https://kalm.dev/docs/intro.

## License

[Apache License V2](LICENSE.txt)
