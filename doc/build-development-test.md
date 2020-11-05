# Development envs

## start minikube cluster
```
minikube start
```

## run operator

```
cd operator
make install
make run
```

```
kubectl apply -f operator/config/samples/install_v1alpha1_kalmoperatorconfig_ignore_kalm_controller.yaml
```

## run controller

```
cd controller
make install
make run
```

## run api

```
cd api
air
```

## run frontend

```
cd frontend
npm run start
```