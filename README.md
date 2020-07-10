# Kapp - Kubernetes application manager

[![codecov](https://codecov.io/gh/kapp-staging/kapp/branch/master/graph/badge.svg)](https://codecov.io/gh/kapp-staging/kapp) [![Build Status](https://travis-ci.com/kapp-staging/kapp.svg?branch=master)](https://travis-ci.com/kapp-staging/kapp) [![Go Report](https://goreportcard.com/badge/github.com/kapp-staging/kapp)](https://goreportcard.com/badge/github.com/kapp-staging/kapp)

More than just another kubernetes dashboard, but also a new angle of application management.

## Warning

This project is under a very aggressive development. Application schema and api will change and forward compatibility is not guaranteed. Please do not use this project in your production environment. It will be super helpful if you use Kapp in your staging/alpha release system and give us feedbacks. This warning will be removed until  the first official release, which means it's production ready.

## What's kapp?

TODO

## Try kapp in action

```shell
kubectl apply -f https://raw.githubusercontent.com/kapp-staging/kapp/master/kapp-install.yaml
```

wait till `kubectl get pods -n kapp-operator` returns something like this:

```
NAME                            READY   STATUS    RESTARTS   AGE
kapp-operator-c7cd8cffc-4grps   2/2     Running   0          4m26s
```

and `kubectl get pods -n kapp-system` returns something like this:

```
NAME                               READY   STATUS    RESTARTS   AGE
kalm-dashboard-6bbb5894-q8sb5      2/2     Running   0          3m42s
kapp-controller-686c55b89b-6s29x   2/2     Running   0          4m8s
```

Kalm is installed now.



if your prefer commond line, go read [tutorial-1-hello-world.md](doc/tutorial-1-hello-world.md) to see what you can do with Kalm, or if you prefer GUI, Kalm has a dashboard prepared for you, to visited the dashboard, you need:

```
# your dashboard pod name should be different
kubectl port-forward -n kapp-system kalm-dashboard-6bbb5894-q8sb5 3001:3001 
```

then go to `http://localhost:3001`, follow the doc [create-test-service-account.md](doc/create-test-service-account.md) to get the token to access dashboard.

## Documentation

TODO

## License

[Apache License V2](LICENSE.txt)
