# Kapp Operator

The kapp operator is a crd controller that runs on the cluster as a deployment. It will install the entire kapp environment, including istio and cert-manager.

Using the kapp operator in production and development environments can be significantly different. Let's talk about them case by case.

# Using kapp operator in production

This is our ideal way to install kapp for a cluster. The prerequirements are a running k8s cluster and a configured kubectl command.

There will be a generated single file yaml. The only thing you need to do is apply it into your cluster.

```bash
# Note: This url is not working now.
kubectl apply -f https://github.com/kapp-staging/kapp/deploy/kapp-install.yaml
```

This command runs the operator by creating the following resources in the cluster.
- The kapp operator config custom resource definition
- Necessary kapp operator RBAC rules, roles and bindings
- The kapp operator controller deployment
- A service to access operator metrics

The following resources will be also installed. They are kapp dependencies.
- Cert Manager custom resource definitions
- Cert Manager RBAC rules, roles and bindings
- Cert Manager Deployment and services.
- Cert Manager Webhooks
- Istio operator in istio-operator namespace
- Istio deployments and services in istio-system namespace
- Istio RBAC rules, roles and bindings

#### How is this `kapp-install` file generated?

You can view the operator project under root kapp dir. It is based on the kubebuilder framework. `Kustomize build config / default` in the root directory of the project can almost do the job. The only remaining problem is that you have to ensure that the images(kapp controller and kapp operator) in yaml have been uploaded correctly.

# Using Kapp operator in development env

This part is useful for developers who won't make change for controller and operator, and only need them are running. Otherwize, you'd better launch each component manuanlly as usual.

Assuming you have a fresh minikube cluster.

#### Prepare controller image

Open a terminal and go to kapp controller dir

```bash
cd controller

# execute minikube docker env. Now, your docker client will connect to the dockerd in minkube virtual machine.
eval $(minikube docker-env)

# build controller image
make docker-build

# wait the build process finished
docker images

# You should see a image called kapp/controller:latest
# This step won't happen in production because we will publish a controller image on docker hub.
```

#### Run operator

There are two ways to run operator. The first is running it manually on your localhost. The second is running operator image in the cluster. Choose the one you prefer.

##### run on localhost

Keep in mind, in this way, the operator is running under the kubectl current context user's psermission. It means kapp operator RBACs are not take effects.

```bash
cd operator

make install

make run
```

##### run on cluster

```bash
# execute minikube docker env. Now, your docker client will connect to the dockerd in minkube virtual machine.
eval $(minikube docker-env)

make docker-build

make deploy
```

#### Apply a kapp operator config

open a new terminal

```bash
# goto operator dir
cd operator

# apply a kapp operator config
kubectl apply -f config/samples/install_v1alpha1_kappoperatorconfig.yaml
```

#### Check kapp operator status

```bash
# There should be three pods running in cert manager namespace
kubectl get pods -n cert-manager

# Istio operator should be running in istio-operator namespace
kubectl get pods -n istio-operator

# There should be some pods running in istio-sysmtem namespace
kubectl get pods -n istio-system

# Kapp Controller should be running in kapp-system namespace
kubectl get pods -n kapp-system

# View kapp controller and operator logs
kubectl logs -f -n kapp-system -c manager kapp-controller-xxxxx
kubectl logs -f -n kapp-operator -c manager kapp-operator-xxxxx
```