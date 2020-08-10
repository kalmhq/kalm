#!/bin/bash

# Usage:
# $ bash path_to_this_script arg1 arg2 arg3
# arg1: application name, "all-applications" means export all applications in your cluster
# arg2: target file path, such as "/tmp/my_application.yaml"
# arg3: input "with-cluster" means export all dockerregistries, deploykeys, httpscerts.

function export_namespace () {
  cmd="kubectl get ns $1 "
  patch_cmd="kubectl patch ns $1 "
  export_resource "$cmd" "$patch_cmd"
  echo "$1 exported"
}

function export_namespace_crd () {
  cmd="kubectl get -n $1 $2 $3 "
  patch_cmd="kubectl patch -n $1 $2 $3 "
  export_resource "$cmd" "$patch_cmd"
  echo "$1 $2 $3 exported"
}

function export_cluster_crd () {
  cmd="kubectl get $1 $2 "
  patch_cmd="kubectl patch $1 $2 "
  export_resource "$cmd" "$patch_cmd"
  echo "$1 $2 exported"
}

function export_resource () {
  ops='{"op": "remove", "path": "/metadata/creationTimestamp"},{"op": "remove", "path": "/metadata/resourceVersion"},{"op": "remove", "path": "/metadata/selfLink"},{"op": "remove", "path": "/metadata/uid"}'
  item_status=$(eval "$1 -o=jsonpath={.status}")
  if [ -n "$item_status" ]; then
    ops=$ops',{"op": "remove", "path": "/status"}'
  fi
  last_applied_configuration=$(eval "$1 -o=jsonpath={.metadata.annotations}{.'kubectl.kubernetes.io/last-applied-configuration'}")
  if [ -n "$last_applied_configuration" ]; then
    ops=$ops',{"op": "remove", "path": "/metadata/annotations/kubectl.kubernetes.io~1last-applied-configuration"}'
  fi

  c="'"
  eval "$2 --type json -p=$c[$ops]$c --dry-run -o yaml >> $file_path"
  echo "---" >> $file_path
}

file_path=$2
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
  if [ "$ns" = "kalm-system" ]; then
    continue
  fi

  export_namespace $ns
  for crd in "httproutes" "singlesignonconfigs" "protectedendpoints" "components" "componentplugins" "componentpluginbindings"
  do
    for item in $(kubectl -n $ns get $crd -o=jsonpath={.items[*].metadata.name})
    do
      export_namespace_crd $ns $crd $item
    done
  done
done

if [ "$3" = "with-cluster" ]; then
  for crd in "dockerregistries" "deploykeys" "httpscerts"
  do
    for item in $(kubectl get $crd -o=jsonpath={.items[*].metadata.name})
    do
      export_cluster_crd $crd $item
    done
  done
fi

echo "applications: $apps, exported to file $2"
