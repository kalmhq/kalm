# Setup development environment

1. start localhost k8s cluster

```bash
minikube start
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
```

before you start, you need to apply a token for authorization. If you already have token you can skip this step. Otherwise, please follow [Create test service account](./create-test-service-account.md) to get a token.

You should set this token in window.localStorage.authorization_token.