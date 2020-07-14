#!/bin/bash

echo "setup Kalm"
echo ""

kubectl apply -f https://raw.githubusercontent.com/kalmhq/kalm/master/kalm-install-operator.yaml
## same as running this in code repo:
#kubectl apply -f kalm-install-operator.yaml

CRD_READY=""
while [ "$CRD_READY" != "True" ]
do
  echo -e "\nwaiting for installation of CRD..."
  #sleep 1

  CRD_READY=$(kubectl get crd kalmoperatorconfigs.install.kalm.dev -ojsonpath='{.status.conditions[?(@.type=="Established")].status}')
done

kubectl apply -f https://raw.githubusercontent.com/kalmhq/kalm/master/kalm-install-kalmoperatorconfig.yaml
## same as running this in code repo:
#kubectl apply -f kalm-install-kalmoperatorconfig.yaml

echo -e "\ndone"
