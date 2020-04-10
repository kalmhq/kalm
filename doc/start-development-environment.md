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

3. Start Api Server

```bash
cd api
go run .
```

4. Start frontend

```bash
cd frontend
npm install
npm run start
```

before you start, you need to apply a token for authorization. If you already have token you can skip this step. Otherwise, please follow [Create test service account](./create-test-service-account.md) to get a token.

You should set this token in window.localStorage.authorization_token.

5. test kapp hipster

```bash

kubectl apply -f controller/config/samples/core_v1alpha1_application-hipster.yaml

kubectl port-forward $(kubectl get pod -n kapp-hipster -l kapp-component=frontend  -o jsonpath='{.items[0].metadata.name}') -n kapp-hipster 8080:8080

view http://localhost:8080
```