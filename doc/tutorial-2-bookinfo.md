# more real life Kapp demo

After the hello-world demo, let's see a more real life one: bookinfo, it's an online book store composed by 4 micro services:

1. product page, the frontend of our bookstore
2. reviews, show the reviews of books
3. details, show the details of books
4. ratings, show the ratings of books

![Bookinfo Application](https://istio.io/docs/examples/bookinfo/noistio.svg)



you can find the Kapp yaml file [here](https://github.com/Kapp-staging/Kapp/blob/doc-hello-world/controller/config/samples/core_v1alpha1_tutorial_2_bookinfo.yaml).

To apply the config, go to directory of Kapp project, and run:

```shell
kubectl apply -f controller/config/samples/core_v1alpha1_tutorial_2_bookinfo.yaml
```

The file has serveral yaml configs within, after the walk-through of our previous hello-world demo, most parts in this file should be familiar to you.

The kapp-enabled namesapce:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kapp-bookinfo
  labels:
    istio-injection: enabled
    kapp-enabled: "true"
```



We defined 4 `Component`s for bookinfo: 

- product page
- reviews
- details
- ratings

let's take the product-page Component for example:

```yaml
apiVersion: core.Kapp.dev/v1alpha1
kind: Component
metadata:
    name: productpage
    namespace: Kapp-bookinfo
spec:
    image: docker.io/istio/examples-bookinfo-productpage-v1:1.15.0
    replicas: 2
    podAffinityType: prefer-fanout
    nodeSelectorLabels:
      kubernetes.io/os: linux
    cpu: 50m
    memory: 64Mi
    ports:
        - name: http
          containerPort: 9080
          servicePort: 9080
    volumes:
        - path: /tmp
          type: emptyDir
          size: 32Mi
```

You may notice some new fields in the `spec` of our `Component`:

```yaml
spec:
    ...
    replicas: 2
    podAffinityType: prefer-fanout
    nodeSelectorLabels:
      kubernetes.io/os: linux
```

`replicas` means we want 2 instance of our frontend, it's a common practice to avoid single point of failure.

`podAffinityType` controls the physical distribution of our instances, it makes sense when we have serval replicas of our service. now it has two possible values:

- prefer-fanout
- prefer-gather

when `prefer-fanout` is set, Kapp will try it is best to arrange the instances on different nodes, so that if 1 node on which our frontend `productpage` is down, we still have another frontend running.

 if in some cases, you want all your instances running on the same node, you can use `prefer-gather`

`nodeSelectorLabels` can be used to select the nodes we want our instance running at, `kubernetes.io/os: linux` means we want to run at the nodes with label: `kubernetes.io/os`, and value: `linux`.



we can also allocate the resouces we want to give to our instances:

```yaml
spec:
    ...
    cpu: 50m
    memory: 64Mi
```

here we assign 50m CPU and 64Mi memory to each of our instance.



if we want to attach storage to containers, we use volumes:

```yaml
spec:
    ...
    volumes:
        - path: /tmp
          type: emptyDir
          size: 32Mi
```

Kapp support 3 volumes types:

- emptyDir
- emptyDirMemory
- pvc

`emptyDir` is a simple empty directory used for storing transient data. The data will disappear if the pod die. for `/tmp` directory, this is exactly what we need, so we choose `emptyDir` in our example.

`emptyDirMemory` is similiar to `emptyDir`, except that it use memory as the medium of storage.

`pvc` is PersistentVolumeClaim, unlike `emptyDir`, the data still exists if pod dies.



Kapp tries to simplify the use of kubernetes, one way to do this is to hide the complex but not so often used concepts, and only expose the more common used concepts to our user, but when you want to use the less-common-used features in k8s, it's possible too, and this is done by plugins:

```yaml
apiVersion: core.Kapp.dev/v1alpha1
kind: ComponentPlugin
metadata:
  name: termination-grace
spec:
  src: |
    function AfterPodTemplateGeneration(pod) {
      var config = getConfig();

      if (!config) {
        return;
      }

      if (config.periodSeconds) {
        pod.spec.terminationGracePeriodSeconds = config.periodSeconds;
      }

      return pod;
    }
  configSchema:
    type: object
    properties:
      periodSeconds:
        type: number
```

In above config, we define a `ComponentPlugin` named: `termination-grace`.  

In k8s pod spec, `terminationGracePeriodSeconds` controls the time when pod ends, how long it will wait to be killed, Kapp don't support configuration of this parameter directly, but you can achieve it using a Kapp plugin like above.



First we declare it is a plugin for `Component`:

```yaml
kind: ComponentPlugin
```

`spec` of `ComponentPlugin` has two fields:

-  src
- configSchema

`src` is Javasript code that can do various things, here in our example, we mutate the pod definition, add `terminationGracePeriodSeconds` to it. 

Kapp provides serveral hooks for us to call to run your code in diffenent stages, including:

- AfterPodTemplateGeneration
- BeforeDeploymentSave
- BeforeServiceSave
- BeforeCronjobSave

just as the name suggests, `AfterPodTemplateGeneration` is called after the pod template is generated, but before it saved. It's a ideal place we mutate the specs of our pod.



in our plugin's Javascript `src`, we have:

```yaml
var config = getConfig();
```

`getConfig()` is a method we provided to get configs for our plugin, the config schema is defined by `configSchema`

```yaml
  configSchema:
    type: object
    properties:
      periodSeconds:
        type: number
```

it's a OpenAPI 3.0 definition which shows the config is an object, which has 1 property: `periodSeconds`, and type of `periodSeconds` is number.

we pass the config  and apply the plugin to our Component using a binding: `ComponentPluginBinding`:

```yaml
apiVersion: core.Kapp.dev/v1alpha1
kind: ComponentPluginBinding
metadata:
  name: termination-grace
  namespace: Kapp-bookinfo
spec:
  pluginName: termination-grace
  componentName: productpage
  config:
    periodSeconds: 5
```

in the binding, we bind the plugin: `termination-grace` to Component `productpage`, we want the `terminationGracePeriodSeconds` to be 5 seconds, so we pass config as: `periodSeconds: 5`. 

With this `ComponentPluginBinding`, after  the pod definition for our productpage is generated, the code in  plugin: `termination-grace` will be called, and we insert `terminationGracePeriodSeconds` into the spec of our pod. 

So we managed to config a native kubernetes concept not directy exposed in Kapp. 

Next, let's see another similar but slightly more complex user-defined plugin: 

```yaml
apiVersion: core.Kapp.dev/v1alpha1
kind: ComponentPlugin
metadata:
  name: http-health-probe
spec:
  src: |
    function addProbesForContainer(container) {
      ...
    }

    function AfterPodTemplateGeneration(pod) {
      var containers = pod.spec.containers;
      containers.forEach(addProbesForContainer)
      return pod;
    }
  configSchema:
    type: object
    properties:
      port:
        type: number
      initialDelaySeconds:
        type: number
      periodSeconds:
        type: number
```

In native k8s config, we can set Probes to check if our instance is running ok, Probe is also not directly available in Kapp.

Here we use the kapp plugin to add `readinessProbe` and `livenessProbe` to our container.

The code of this plugin is longer but the structure is quite similiar, we implement the hook: `AfterPodTemplateGeneration`, and for each pod, we call `addProbesForContainer` to add probes to our containers:

```yaml
spec:
  src: |
    function addProbesForContainer(container) {
      ...
    }

    function AfterPodTemplateGeneration(pod) {
      var containers = pod.spec.containers;
      containers.forEach(addProbesForContainer)
      return pod;
    }
```

the binding is also similiar: 

```yaml
apiVersion: core.Kapp.dev/v1alpha1
kind: ComponentPluginBinding
metadata:
  name: productpage-http-health-probe
  namespace: Kapp-bookinfo
spec:
  pluginName:  http-health-probe
  componentName: productpage
  config:
    port: 9080
```

we bind component: `productpage` to our plugin: `http-health-probe`, and we set the port number to probe in our config.



Finally, it's the `HttpRoute`:

```yaml
apiVersion: core.kapp.dev/v1alpha1
kind: HttpRoute
metadata:
  name: bookinfo
  namespace: kapp-bookinfo
spec:
  hosts:
    - "bookinfo.demo.com"
  methods:
    - GET
    - POST
  schemes:
    - http
  paths:
    - /
  destinations:
    - host: productpage
      weight: 1
  stripPath: true
```

We saw it in our hello-world demo, we use this to enable external access of our service.

This time we assign a host name to our frontend page: `bookinfo.demo.com`.

We can try access our bookinfo fronend using commands:

```shell
INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
INGRESS_HOST=$(minikube ip)

curl -H"Host: bookinfo.demo.com" http://$INGRESS_HOST:$INGRESS_PORT
```

If everything is ok, you should get a long html response like this:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Simple Bookstore App</title>
....
```

## The end



