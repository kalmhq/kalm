# hello world Kapp

In this tutorial we use a hello-world Kapp config helps you to understand concepts in Kapp. 

To apply the config, go to directory of Kapp project, and run:

```shell
kubectl apply -f controller/config/samples/core_v1alpha1_tutorial_1_hello-world.yaml
```

Content of `core_v1alpha1_tutorial_1_hello-world.yaml` is:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kapp-hello-world
  labels:
    istio-injection: enabled
    kapp-enabled: "true"
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
kind: HttpRoute
metadata:
  name: hello-world
  namespace: kapp-hello-world
spec:
  hosts:
    - "*"
  methods:
    - GET
    - POST
  schemes:
    - http
  paths:
    - /
  destinations:
    - host: hello-world
      weight: 1
  stripPath: true
```

## config walkthrough

our hello-world Kapp config contains 3 yaml files.

  

**first one is simple:**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kapp-hello-world
  labels:
    istio-injection: enabled
    kapp-enabled: "true"
```

It defines a namespace for your app, notice the two labels we set here:

-  `istio-injection: enabled`, we use this to ensure `Istio` works in this namespace, `Istio` is a tool which makes the network of our microservices more powerful.
- `kapp-enabled: "true"`, we use this label to tell that this domain should be managed by our kapp system.

  

**The second yaml file defines the workload in our application using Component**:

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

  

With the 2 yaml files above, if we apply it using kubectl, our first Kapp application can be up and running, but how can we make sure that everything is ok, wouldn't it be nice if we can access our hello-world demo from browser? Yes and that's why the following yamls config exist: it helps enable the external access of our service.

  

**The third yaml file** defines a route to our Component `hello-world` :

```yaml
apiVersion: core.kapp.dev/v1alpha1
kind: HttpRoute
metadata:
  name: hello-world
  namespace: kapp-hello-world
spec:
  hosts:
    - "*"
  methods:
    - GET
    - POST
  schemes:
    - http
  paths:
    - /
  destinations:
    - host: hello-world
      weight: 1
  stripPath: true
```

If you have worked with Nginx before, the spec of `HttpRoute` should be quite familiar for you, basically, we defined a wildcard route which will direct all GET and POST reqeusts to our Component: `hello-world`.

Now you should be able to access our hello-world service using the commands below:

```shell
INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
INGRESS_HOST=$(minikube ip)
echo http://$INGRESS_HOST:$INGRESS_PORT

curl $INGRESS_HOST:$INGRESS_PORT
```

If everything is ok, you should see something like this for the above `curl` command:

```shell
# should see
# <html><head><title>HTTP Hello World</title></head><body><h1>Hello from hello-world-766c4b96fc-m6vmv</h1></body></html>
```

## what is next 

The hello-world demo is simple enough to introduce some basic but important concepts in Kapp, for a more real life demo, read [tutorial-2-bookinfo.md](tutorial-2-bookinfo.md)