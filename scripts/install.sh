#!/bin/bash

echo "setup Kalm"
echo ""

kubectl apply -f https://raw.githubusercontent.com/kalmhq/kalm/master/kalm-install-operator.yaml
## same as running this in code repo:
#kubectl apply -f kalm-install-operator.yaml

CRD_ESTABLISHED=""
CRD_NAMES_ACCEPTED=""

while [ "$CRD_ESTABLISHED" != "True" ] || [ "$CRD_NAMES_ACCEPTED" != "True" ]
do
  echo -e "\nwaiting for installation of CRD..."
  #sleep 1

  CRD_ESTABLISHED=$(kubectl get crd kalmoperatorconfigs.install.kalm.dev -ojsonpath='{.status.conditions[?(@.type=="Established")].status}')
  CRD_NAMES_ACCEPTED=$(kubectl get crd kalmoperatorconfigs.install.kalm.dev -ojsonpath='{.status.conditions[?(@.type=="NamesAccepted")].status}')
done

kubectl apply -f https://raw.githubusercontent.com/kalmhq/kalm/master/kalm-install-kalmoperatorconfig.yaml
## same as running this in code repo:
#kubectl apply -f kalm-install-kalmoperatorconfig.yaml

echo -e "\ndone"
