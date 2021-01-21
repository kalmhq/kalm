# Setup development environment

1. start localhost k8s cluster

    ```bash
    minikube start --memory 8192 --cpus 4  --kubernetes-version v1.18.0
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
    make dev
    ```

5. Start Api Server
    ```bash
    cd api

    # if you don't have air installed
    go get -u github.com/cosmtrek/air

    air
    ```

6. Start frontend

    ```bash
    cd frontend

    # before start, copy .env.sample to .env, then edit .env

    npm install
    npm run start
    ```

7. Get a access token
    ```bash
    curl -X POST http://localhost:3010/admin/debug/admin

    # use the token to login via frontend
    ```