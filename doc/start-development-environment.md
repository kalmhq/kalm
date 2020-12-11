# Setup development environment

1. start localhost k8s cluster

    ```bash
    minikube start --memory 8192 --cpus 4  --kubernetes-version v1.15.0
    minikube addons enable metrics-server
    ```
2. Start operator

    ```
    # in a new bash session
    cd operator
    make install
    make run
    ```
3. Apply operator config
    ```
    # in a new bash session
    kubectl apply -f operator/config/samples/install_v1alpha1_kalmoperatorconfig_ignore_kalm_controller.yaml

    # check if istio and cert-manager are installed
    kubectl get pods -A
    ```

4. Start Controller

    ```
    # in a new bash session
    cd controller
    make install
    make run
    ```

5. Start Api Server

    ```bash
    cd api
    air

    # if you don't have air installed
    go get -u github.com/cosmtrek/air
    ```

6. Start frontend

    ```bash
    cd frontend

    # before start, copy .env.sample to .env, then edit .env

    npm install
    npm run start
    ```