# Kalm Operator

The kalm operator is a crd controller that runs on the cluster as a deployment. It will install the entire kalm environment, including istio and cert-manager.

Using the kalm operator in production and development environments can be significantly different. Let's talk about them case by case.

# Using kalm operator in production

This is our ideal way to install kalm for a cluster. The prerequirements are a running k8s cluster and a configured kubectl command.

There will be a generated single file yaml. The only thing you need to do is apply it into your cluster.

```bash
kubectl apply -f https://raw.githubusercontent.com/kalmhq/kalm/v0.1.0-rc.5/operator/kalm-install.yaml
```

This command runs the operator by creating the following resources in the cluster.

- The kalm operator config custom resource definition
- Necessary kalm operator RBAC rules, roles and bindings
- The kalm operator controller deployment
- A service to access operator metrics

The following resources will be also installed. They are kalm dependencies.

- Cert Manager custom resource definitions
- Cert Manager RBAC rules, roles and bindings
- Cert Manager Deployment and services.
- Cert Manager Webhooks
- Istio operator in istio-operator namespace
- Istio deployments and services in istio-system namespace
- Istio RBAC rules, roles and bindings

#### How is this `kalm-install` file generated?

You can view the operator project under root kalm dir. It is based on the kubebuilder framework. `Kustomize build config / default` in the root directory of the project can almost do the job. The only remaining problem is that you have to ensure that the images(kalm controller and kalm operator) in yaml have been uploaded to docker hub correctly.

# Using Kalm operator in development env

This part is useful for developers who won't make change for controller and operator, and only need them are running. Otherwize, you'd better launch each component manuanlly as usual.

Assuming you have a fresh minikube cluster.

#### About controller

If you want operator to install the controller, you need to make the controller docker image first.

But if not, you can still manually run controller on your localhost and tell operator not to install it for you. It will be helpful if you modify controller source often. You can skip the controller image build step.

##### step to build controller image

```bash
cd controller

# execute minikube docker env. Now, your docker client will connect to the dockerd in minkube virtual machine.
eval $(minikube docker-env)

# build controller image
make docker-build

# wait the build process finished
docker images

# You should see a image called kalmhq/kalm-controller:latest
# This step won't happen in production because we will publish a controller image on docker hub.
```

#### Run operator

There are two ways to run operator. The first is running it manually on your localhost. The second is running operator image in the cluster. Choose the one you prefer.

##### run on localhost

Keep in mind, in this way, the operator is running under the kubectl current context user's psermission. It means kalm operator RBACs are not take effects.

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

#### Apply a kalm operator config

open a new terminal

```bash
# goto operator dir
cd operator

# apply a kalm operator config

# If you are running controller manually, please use
kubectl apply -f config/samples/install_v1alpha1_kalmoperatorconfig_ignore_kalm_controller.yaml
# otherwize
kubectl apply -f config/samples/install_v1alpha1_kalmoperatorconfig.yaml
```

#### Check kalm operator status

```bash
# There should be three pods running in cert manager namespace
kubectl get pods -n cert-manager

# Istio operator should be running in istio-operator namespace
kubectl get pods -n istio-operator

# There should be some pods running in istio-sysmtem namespace
kubectl get pods -n istio-system

# Kalm Controller should be running in kalm-system namespace
kubectl get pods -n kalm-system

# Kalm Operator should be running in kalm-operator namespace
kubectl get pods -n kalm-operator

# View kalm controller and operator logs
kubectl logs -f -n kalm-system -c manager kalm-controller-xxxxx
kubectl logs -f -n kalm-operator -c manager kalm-operator-xxxxx
```
