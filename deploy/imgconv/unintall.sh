#! /bin/bash

kubectl delete mutatingwebhookconfigurations.admissionregistration.k8s.io imgconv
kubectl delete ns kalm-imgconv