#!/bin/sh

for ns in kapp-operator kapp-system cert-manager istio-system
do
  kubectl get pods -n $ns
  echo ""
done
