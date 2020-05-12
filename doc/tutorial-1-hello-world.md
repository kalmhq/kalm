# hello world Kapp

In this tutorial we use a hello-world Kapp config helps you to understand concepts in Kapp. 

To apply the config, go to directory of Kapp project, and run:

```shell
kubectl apply -f controller/config/samples/core_v1alpha1_hello-world.yaml
```

Content of `core_v1alpha1_hello-world.yaml` is:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: Kapp-hello-world
  labels:
    istio-injection: enabled
---
apiVersion: core.Kapp.dev/v1alpha1
kind: Application
metadata:
  name: Kapp-hello-world
spec:
  isActive: true
---
apiVersion: core.Kapp.dev/v1alpha1
kind: Component
metadata:
    name: hello-world
    namespace: Kapp-hello-world
spec:
    image: strm/helloworld-http:latest
    ports:
        - name: http
          containerPort: 80
          servicePort: 80
---
apiVersion: core.Kapp.dev/v1alpha1
kind: ApplicationPlugin
metadata:
  name: Kapp-builtin-application-plugin-ingress
spec:
  src: |
    function AfterApplicationSaved() {
      __builtinApplicationPluginIngress();
    }
  configSchema:
    title: Ingress rules
    type: object
    required:
      - hosts
      - paths
    properties:
      hosts:
        type: array
        items:
          type: string
      httpsCert:
        type: string
      paths:
        type: array
        items:
          type: string
      stripPath:
        type: boolean
      destinations:
        type: array
        items:
          type: object
          properties:
            destination:
              type: string
            weight:
              type: number
---
apiVersion: core.Kapp.dev/v1alpha1
kind: ApplicationPluginBinding
metadata:
  name: Kapp-builtin-application-plugin-ingress
  namespace: Kapp-bookinfo
spec:
  pluginName:  Kapp-builtin-application-plugin-ingress
  config:
    hosts:
      - "*"
    paths:
      - "/"
    destinations:
      - destination: hello-world:80
```

## config walkthrough

our hello-world Kapp config contains 5 yaml files.



**first one is simple:**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: Kapp-hello-world
  labels:
    istio-injection: enabled
```

It defines a namespace for your app, notice the label we set here: `istio-injection: enabled`, we use this to ensure `Istio` works in this namespace, `Istio` is a tool which makes the network of our microservices more powerful.



**The second yaml file defines a Kapp Application:**

```yaml
apiVersion: core.Kapp.dev/v1alpha1
kind: Application
metadata:
  name: Kapp-hello-world
spec:
  isActive: true
```

one Kapp `Application` governs one namespace, the relationship is 1:1，here they share the same name: `Kapp-hello-world`, and notice the spec of our application:

```yaml
spec:
  isActive: true
```

`isActive` is a switch to control whether the workloads under the namespace should be running or not.



**The third yaml file defines the workload in our application using Component**

```yaml
apiVersion: core.Kapp.dev/v1alpha1
kind: Component
metadata:
    name: hello-world
    namespace: Kapp-hello-world
spec:
    image: strm/helloworld-http:latest
    ports:
        - name: http
          containerPort: 80
          servicePort: 80
```

we define workload in Kapp using `Component`: 

```yaml
kind: Component
```

In metadata:

```yaml
metadata:
    name: hello-world
    namespace: Kapp-hello-world
```

we give our `Component` a unique name: hello-world, then we assign it to the same namespace as our `Application`. This makes our `Component` under the control of our `Application`.

The spec of our `Component` is very concise:

```yaml
spec:
    image: strm/helloworld-http:latest
    ports:
        - name: http
          containerPort: 80
          servicePort: 80
```

we set the image of our `Component`, and then defined the port. It's very similar to definition in Dockerfile.



With the 3 yaml files above, if we apply it using kubectl, our first Kapp application can be up and running, but how can we make sure that everything is ok, wouldn't it be nice if we can access our hello-world demo from browser? Yes and that's why the following 2 yamls configs exist: they help enable the external access of our service.



**The fouth yaml file is a definition of our buildin plugin.**

(when Kapp is installed in future, all our buildin plugins should have been installed too, in that case, we don't need to show the definition here in our tutorial, I include it here to make the process smoother in current stage, the explain of buildin Kapp plugin is omitted here)



**The fifth yaml file** defines an `ApplicationPluginBinding` which bind our component to a Kapp buildin plugin,  Kapp plugin is a way to add more capbilities to our workloads, for example, the `Kapp-builtin-application-plugin-ingress` plugin we use here makes our hello-world service exposed to external network, which makes accessing the service from browser possible.

```yaml
spec:
  pluginName:  Kapp-builtin-application-plugin-ingress
```

`pluginName` defines the plugin we want to use, Kapp provides serveral buildin plugins, `Kapp-builtin-application-plugin-ingress` is one of them.

```yaml
spec:
  ...
  config:
    hosts:
      - "*"
    paths:
      - "/"
    destinations:
      - destination: productpage:80	
```

`config` defines the configuration for the plugin.

- for `hosts`, we don't have a specific host name for our service yet, so let's use a wildcard here: `*`.

- `paths` defines the url paths we want to intercept, we use `/` to receive all requests here.

- `destinations` defines where we want to direct these requests to, we want to welcome our user with our hello-world service, so we set `destination: hello-world:80`

now you should be able to access our hello-world service using the commands below:

```shell
INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
INGRESS_HOST=$(minikube ip)
echo http://$INGRESS_HOST:$INGRESS_PORT

curl $INGRESS_HOST:$INGRESS_PORT
```

if everything is ok, you should see something like this for the above `curl` command:

```shell
# should see
# <html><head><title>HTTP Hello World</title></head><body><h1>Hello from hello-world-766c4b96fc-m6vmv</h1></body></html>
```

## what is next 

the hello-world demo is simple enough to introduce some basic but important concepts in Kapp, for a more real life demo, read [tutorial-2-bookinfo.md](todo)