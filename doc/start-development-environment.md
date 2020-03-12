# Sepup development environment

1. start localhost k8s cluster

```
minikube start
```

2. Install CRD

```
cd controller
```

```
make install
```

1. Start Controller

```
cd controller
make run
```

This step is **optional**. You can find some samples in config/samples dir. Choose the ones you need then install them.

```
kubectl apply -f config/samples/___.yaml
```

4. Start Api Server

```
cd api
go run .
```

5. Start frontend

```
cd frontend
```

before you start, you need to apply a token for authorization. If you already have token you can skip this step. Otherwise, please follow [Create test service account](./create-test-service-account.md) to get a token.

You should pass this token in REACT_APP_TEST_TOKEN environment variable when you start frontend project.

```
REACT_APP_TEST_TOKEN=xxx npm run start
```

Another approach is to set this variable in your .env file.
