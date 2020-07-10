#!/bin/sh

echo "this outputs pod status in all Kalm related namespaces"
echo ""

for ns in kapp-operator kapp-system cert-manager istio-system
do
  kubectl get pods -n $ns
  echo ""
done
