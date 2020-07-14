# Kalm - Kubernetes application manager

[![codecov](https://codecov.io/gh/kalmhq/kalm/branch/master/graph/badge.svg)](https://codecov.io/gh/kalmhq/kalm) [![Build Status](https://travis-ci.com/kalmhq/kalm.svg?branch=master)](https://travis-ci.com/kalmhq/kalm) [![Go Report](https://goreportcard.com/badge/github.com/kalmhq/kalm)](https://goreportcard.com/badge/github.com/kalmhq/kalm)

More than just another kubernetes dashboard, but also a new angle of application management.

## Warning

This project is under a very aggressive development. Application schema and api will change and forward compatibility is not guaranteed. Please do not use this project in your production environment. It will be super helpful if you use Kalm in your staging/alpha release system and give us feedbacks. This warning will be removed until  the first official release, which means it's production ready.

## What's kalm?

TODO

## Try kalm in action

```shell
curl -sL https://raw.githubusercontent.com/kalmhq/kalm/master/scripts/install.sh | bash
```

to check if Kalm is installed successfully, run 

```
curl -sL https://raw.githubusercontent.com/kalmhq/kalm/master/scripts/check-kalm-pods.sh | bash
```

if you see somthing like this, then Kalm is running as expected:

```
NAME                            READY   STATUS    RESTARTS   AGE
kalm-operator-c7cd8cffc-4grps   2/2     Running   0          56m

NAME                               READY   STATUS    RESTARTS   AGE
kalm-dashboard-6bbb5894-q8sb5      2/2     Running   0          55m
kalm-controller-686c55b89b-6s29x   2/2     Running   0          55m

NAME                                       READY   STATUS    RESTARTS   AGE
cert-manager-7cb75cf6b4-gbhw7              1/1     Running   1          43h
cert-manager-cainjector-759496659c-h6ggk   1/1     Running   1          43h
cert-manager-webhook-7c75b89bf6-lfpp5      1/1     Running   1          43h

NAME                                    READY   STATUS    RESTARTS   AGE
istio-ingressgateway-7bf98d4db8-c4czn   1/1     Running   1          43h
istiod-6fd48c8cc7-9gj6m                 1/1     Running   1          43h
prometheus-5767f54db5-82p66             2/2     Running   2          43h
```



if your prefer commond line, go read [tutorial-1-hello-world.md](doc/tutorial-1-hello-world.md) to see what you can do with Kalm, or if you prefer GUI, Kalm has a dashboard prepared for you, to visited the dashboard, you need:

```
kubectl port-forward -n kalm-system $(kubectl get pod -n kalm-system -l app=kalm-dashboard -ojsonpath="{.items[0].metadata.name}") 3001:3001
```

then go to [http://localhost:3001](http://localhost:3001), follow the doc [create-test-service-account.md](doc/create-test-service-account.md) to get the token to access dashboard.

## Clean up

```
# first clone this repo
git clone https://github.com/kalmhq/kalm.git

cd kalm

# to delete kalm operator & controller, run:
make delete
# error like `Error from server (NotFound): error when deleting xxx not found` is safe to ignore because some resources may have been deleted hierarchically.

# to delete all things Kalm installed, including istio and cert-manager, run:
# make delete-all
```



## Documentation

TODO

## License

[Apache License V2](LICENSE.txt)
