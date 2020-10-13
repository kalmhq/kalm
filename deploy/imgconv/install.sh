#! /bin/bash

set -e

temp_dir=$(mktemp -d)
trap "rm -f $temp_file" 0 2 3 15

# generate key
openssl genrsa -out $temp_dir/key.pem 2048k

# self signed certificate
openssl req -new -x509 -key $temp_dir/key.pem -out $temp_dir/cert.pem -days 36500 -subj '/CN=imgconv.kalm-imgconv.svc'


# create namespace
kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: kalm-imgconv
  labels:
    imgconv: disabled
EOF

# save the genereated cert and key in secret
kubectl create secret generic imgconv-certs --from-file=key.pem=$temp_dir/key.pem --from-file=cert.pem=$temp_dir/cert.pem -n kalm-imgconv

base64_cert=$(base64 $temp_dir/cert.pem)

# install the imgconv deployment
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: imgconv
  namespace: kalm-imgconv
  labels:
    app: imgconv
spec:
  replicas: 1
  selector:
    matchLabels:
      app: imgconv
  template:
    metadata:
      labels:
        app: imgconv
    spec:
      containers:
        - name: imgconv
          image: kalmhq/kalm:latest
          command:
            - ./imgconv
          args:
            - -certfile=/certs/cert.pem
            - -keyfile=/certs/key.pem
            - -cloud=QuayIo
          volumeMounts:
            - mountPath: /certs
              name: certs
              readOnly: true
      volumes:
        - name: certs
          secret:
            secretName: imgconv-certs
---
apiVersion: v1
kind: Service
metadata:
  name: imgconv
  namespace: kalm-imgconv
spec:
  ports:
    - protocol: TCP
      port: 443
      targetPort: 3000
  selector:
    app: imgconv
---
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  name: imgconv
webhooks:
  - name: imgconv.kalm.dev
    namespaceSelector:
      matchExpressions:
        - key: imgconv
          operator: NotIn
          values: ["disabled"]
    admissionReviewVersions:
      - v1beta1
    sideEffects: None
    reinvocationPolicy: IfNeeded
    clientConfig:
      caBundle: $base64_cert
      service:
        name: imgconv
        namespace: kalm-imgconv
        path: /
        port: 443
    rules:
      - operations: ["CREATE", "UPDATE"]
        apiGroups: [""]
        apiVersions: ["v1"]
        resources: ["pods"]
EOF

while [[ $(kubectl get deployments.apps -n kalm-imgconv imgconv -ojsonpath='{.status.conditions[?(@.type=="Available")].status}') != "True" ]]; do
  echo "waiting for imgconv deployment ready" && sleep 1;
done