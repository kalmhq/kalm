#!/bin/bash

# Usage:
# $ bash path_to_this_script arg1 arg2 arg3
# arg1: application name, "all-applications" means export all applications in your cluster
# arg2: target file path, such as "/tmp/my_application.yaml"
# arg3: input "with-cluster" means export all dockerregistries, deploykeys, httpscerts.

if [ -z "$2" ]; then
  echo "file $2 not exists"
  echo "exit"
  exit 0
fi

apps=""
if [ "$1" = "all-applications" ]; then
  apps=$(kubectl get ns -o jsonpath='{.items[?(@.metadata.labels.kalm-enabled == "true")].metadata.name}')
  status=$?

  if [ $status -gt 0 ] || [ -z "$apps" ]; then
    echo "no applications in your cluster"
    echo "exit"
    exit 0
  fi
else
  apps=$(kubectl get ns $1 -o=jsonpath={.metadata.name} 2>&1)
  status=$?

  if [ $status -gt 0 ] || [ -z "$apps" ]; then
    echo "can not find application $1"
    echo "exit"
    exit 0
  fi
fi

echo "start exporting applications: $apps, to file $2"
echo ""

echo "---" > $2
for ns in $apps
do
  eval "kubectl get namespace $ns -o yaml >> $2"
  echo "---" >> $2
  for crd in "httproutes" "singlesignonconfigs" "protectedendpoints" "components" "componentplugins" "componentpluginbindings"
  do
    for item in $(kubectl -n $ns get $crd -o=jsonpath={.items[*].metadata.name})
    do
      ops='{"op": "remove", "path": "/metadata/creationTimestamp"},{"op": "remove", "path": "/metadata/resourceVersion"},{"op": "remove", "path": "/metadata/selfLink"},{"op": "remove", "path": "/metadata/uid"}'
      item_status=$(kubectl -n $ns get $crd $item -o=jsonpath={.status})
      if [ -n "$item_status" ]; then
        ops=$ops',{"op": "remove", "path": "/status"}'
      fi
      last_applied_configuration=$(kubectl -n $ns get $crd $item -o=jsonpath={.metadata.annotations}{.'kubectl.kubernetes.io/last-applied-configuration'})
      if [ -n "$last_applied_configuration" ]; then
        ops=$ops',{"op": "remove", "path": "/metadata/annotations/kubectl.kubernetes.io~1last-applied-configuration"}'
      fi

      c="'"
      eval "kubectl -n $ns patch $crd $item --type json -p=$c[$ops]$c --dry-run -o yaml >> $2"
      echo "---" >> $2
      echo "$ns $crd $item exported"
    done
  done
done

if [ "$3" = "with-cluster" ]; then
  for crd in "dockerregistries" "deploykeys" "httpscerts"
  do
    for item in $(kubectl get $crd -o=jsonpath={.items[*].metadata.name})
    do
      ops='{"op": "remove", "path": "/metadata/creationTimestamp"},{"op": "remove", "path": "/metadata/resourceVersion"},{"op": "remove", "path": "/metadata/selfLink"},{"op": "remove", "path": "/metadata/uid"}'
      item_status=$(kubectl get $crd $item -o=jsonpath={.status})
      if [ -n "$item_status" ]; then
        ops=$ops',{"op": "remove", "path": "/status"}'
      fi
      last_applied_configuration=$(kubectl get $crd $item -o=jsonpath={.metadata.annotations}{.'kubectl.kubernetes.io/last-applied-configuration'})
      if [ -n "$last_applied_configuration" ]; then
        ops=$ops',{"op": "remove", "path": "/metadata/annotations/kubectl.kubernetes.io~1last-applied-configuration"}'
      fi

      c="'"
      eval "kubectl patch $crd $item --type json -p=$c[$ops]$c --dry-run -o yaml >> $2"
      echo "---" >> $2
      echo "cluster $crd $item exported"
    done
  done
fi

echo "applications: $apps, exported to file $2"
