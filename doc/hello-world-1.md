# hello world kapp

a sample kapp config helps you understand concepts(CRD) in Kapp

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kapp-hello-world
  labels:
    istio-injection: enabled
---
apiVersion: core.kapp.dev/v1alpha1
kind: Application
metadata:
  name: kapp-hello-world
spec:
  isActive: true
---
apiVersion: core.kapp.dev/v1alpha1
kind: Component
metadata:
    name: hello-world
    namespace: kapp-hello-world
spec:
    image: strm/helloworld-http:latest
    ports:
        - name: http
          containerPort: 80
          servicePort: 80
---
apiVersion: core.kapp.dev/v1alpha1
kind: ApplicationPlugin
metadata:
  name: kapp-builtin-application-plugin-ingress
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
apiVersion: core.kapp.dev/v1alpha1
kind: ApplicationPluginBinding
metadata:
  name: kapp-builtin-application-plugin-ingress
  namespace: kapp-bookinfo
spec:
  pluginName:  kapp-builtin-application-plugin-ingress
  config:
    hosts:
      - "*"
    paths:
      - "/"
    destinations:
      - destination: hello-world:80
```

## config walkthrough

sample kapp config contains 5 yaml files.



**first one is simple:**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kapp-hello-world
  labels:
    istio-injection: enabled
```

It defines a namespace for your app, notice the label we defined here: `istio-injection: enabled`, we set this to ensure `Istio` works in this namespace, `Istio` is a tool which makes the network of our microservices more powerful.



**The second yaml file defines a kapp Application:**

```yaml
apiVersion: core.kapp.dev/v1alpha1
kind: Application
metadata:
  name: kapp-hello-world
spec:
  isActive: true
```

one kapp Application govens one namespace, so there relationship is 1:1，here they share the same name: `kapp-hello-world`, and notice the spec of our application:

```yaml
spec:
  isActive: true
```

isActive is a switch to control whether the workloads under the namespace should be running or not.



**The third yaml file defines the workload in our application: Component**

```yaml
apiVersion: core.kapp.dev/v1alpha1
kind: Component
metadata:
    name: hello-world
    namespace: kapp-hello-world
spec:
    image: strm/helloworld-http:latest
    ports:
        - name: http
          containerPort: 80
          servicePort: 80
```

 In metadata:

```yaml
metadata:
    name: hello-world
    namespace: kapp-hello-world
```

we give our Component a unique name: hello-world, the we assign it to the same namespace as our Application. This makes our Component under the control of our Application.

The spec of our component is very concise:

```yaml
spec:
    image: strm/helloworld-http:latest
    ports:
        - name: http
          containerPort: 80
          servicePort: 80
```

we set the image of our component, and then defined the port. It's very similar to definition in Dockerfile.



With the 3 yaml files above, if we apply it using kubectl, our first kapp application can be up and running, but how can we make sure that everything is running ok, would it be nice if we can access our hello-world demo from browser? yes and that's why the following 2 yamls exists: they help enable the external access of our service.



**The fouth yaml file is a definition of our buildin plugin.**

(when kapp is installed in future, all our buildin plugins should be installed too, in that case, we don't need to show the definition here in our tutorial, I included it here to make the process smoother in current stage, so the explain of buildin kapp plugin is omitted here)



**The fifth yaml file** defines an `ApplicationPluginBinding` which bind our component to a kapp buildin plugin,  Kapp plugin is a way to add more capbilities to our workloads, for example, the `kapp-builtin-application-plugin-ingress` plugin we use here makes our hello-world service exposed to external network, which makes accessing the service from browser possible.

```yaml
spec:
  pluginName:  kapp-builtin-application-plugin-ingress
```

`pluginName` defines the plugin we want to use, kapp provides serveral buildin plugins, `kapp-builtin-application-plugin-ingress` is one of them.

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

`config` defines the configuration for plugin.

we don't have specific host name for our service yet, so let's use a wildcard here: `*`.

`paths` defines the url path we want to intercept, we use `/` to receive all requests here.

`destinations` defines where we want to direct these requests to, we want to welcome our user with our hello-world service, so we set `destination: hello-world:80`

now you should be able to access our hello-world service now

```shell
INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
INGRESS_HOST=$(minikube ip)
echo http://$INGRESS_HOST:$INGRESS_PORT

curl $INGRESS_HOST:$INGRESS_PORT
# should see
# <html><head><title>HTTP Hello World</title></head><body><h1>Hello from hello-world-766c4b96fc-m6vmv</h1></body></html>
```

## what next 

read [hello-world-2-bookinfo.md] to know more about plugins in kapp