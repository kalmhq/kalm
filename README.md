# Kalm - Kubernetes application manager

[![codecov](https://codecov.io/gh/kalmhq/kalm/branch/master/graph/badge.svg)](https://codecov.io/gh/kalmhq/kalm) [![CircleCI](https://circleci.com/gh/kalmhq/kalm.svg?style=svg)](https://circleci.com/gh/kalmhq/kalm) [![Go Report](https://goreportcard.com/badge/github.com/kalmhq/kalm)](https://goreportcard.com/badge/github.com/kalmhq/kalm)

More than just another kubernetes dashboard, but also a new angle of application management.

## Warning

This project is under a very aggressive development. Application schema and api will change and forward compatibility is not guaranteed. Please do not use this project in your production environment. It will be super helpful if you use Kalm in your staging/alpha release system and give us feedbacks. This warning will be removed until the first official release, which means it's production ready.

## What's kalm?

TODO

## Try kalm in action

```shell
curl -sL https://raw.githubusercontent.com/kalmhq/kalm/master/scripts/install.sh | bash
```

to check if Kalm is installed successfully, run

```
curl -sL https://raw.githubusercontent.com/kalmhq/kalm/master/scripts/check-kalm-install-status.sh | bash
```

the script will keep polling for the status until the installation is done, the whole process can take up to 5 minutes for the first time setup:

```
this outputs deployments status in all Kalm related namespaces

NAME            READY   UP-TO-DATE   AVAILABLE   AGE
kalm-operator   1/1     1            1           16m

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
cert-manager              1/1     1            1           15m
cert-manager-cainjector   1/1     1            1           15m
cert-manager-webhook      1/1     1            1           15m

NAME                   READY   UP-TO-DATE   AVAILABLE   AGE
istio-ingressgateway   1/1     1            1           13m
istiod                 1/1     1            1           14m
prometheus             1/1     1            1           13m

NAME              READY   UP-TO-DATE   AVAILABLE   AGE
kalm              1/1     1            1           11m
kalm-controller   1/1     1            1           12m

🎉 installing done
```

if your prefer commond line, go read [tutorial-1-hello-world.md](doc/tutorial-1-hello-world.md) to see what you can do with Kalm, or if you prefer GUI, Kalm has a dashboard prepared for you, to visited the dashboard, you need:

```
kubectl port-forward -n kalm-system $(kubectl get pod -n kalm-system -l app=kalm -ojsonpath="{.items[0].metadata.name}") 3001:3001
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
