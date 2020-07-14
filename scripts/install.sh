#!/bin/sh

echo "setup Kalm"
echo ""

kubectl apply -f https://raw.githubusercontent.com/kalmhq/kalm/master/kalm-install-operator.yaml
## same as running this in code repo:
#kubectl apply -f kalm-install-operator.yaml

echo -e "\nwaiting for installation of CRD"
sleep 3

kubectl apply -f https://raw.githubusercontent.com/kalmhq/kalm/master/kalm-install-kalmoperatorconfig.yaml
## same as running this in code repo:
#kubectl apply -f kalm-install-kalmoperatorconfig.yaml

echo -e "\ndone"
