import { Application, ApplicationDetails } from "types/application";
import { DockerRegistry, K8sNode, Namespace } from "types/k8s";
import { Node } from "types/node";
import { Registry } from "types/registry";

export const k8sToKalmNamespace = (ns: Namespace): ApplicationDetails => {
  return {
    name: ns.metadata.name,
    metrics: { isMetricServerEnabled: false, cpu: [], memory: [] },
    status: ns.metadata.deletionTimestamp ? "Terminating" : "Active",
    roles: [],
  };
};

export const kalmToK8sNamespace = (ns: Application): Namespace => {
  return {
    kind: "Namespace",
    apiVersion: "v1",
    metadata: {
      name: ns.name,
      labels: {
        "istio-injection": "enabled",
        "kalm-enabled": "true",
      },
    },
  };
};

export const k8sToKalmNode = (node: K8sNode): Node => {
  let internalIP: string = "<none>";

  for (let address of node.status.addresses) {
    if (address.type === "InternalIP") {
      internalIP = address.address;
      break;
    }
  }

  let externalIP: string = "<none>";

  for (let address of node.status.addresses) {
    if (address.type === "ExternalIP") {
      internalIP = address.address;
      break;
    }
  }

  type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
    ? ElementType
    : never;

  const statusTexts: string[] = [];
  const conditionMap: { [key: string]: ArrayElement<K8sNode["status"]["conditions"]> } = {};

  for (let condition of node.status.conditions) {
    conditionMap[condition.type] = condition;
  }

  return {
    name: node.metadata.name,
    creationTimestamp: node.metadata.creationTimestamp ? new Date(node.metadata.creationTimestamp).getTime() : 0,
    labels: node.metadata.labels || {},
    annotations: node.metadata.annotations || {},
    roles: [],
    statusTexts: statusTexts,
    internalIP: internalIP,
    externalIP: externalIP,
    allocatedResources: {
      // TODO: remove this field
      podsCount: 0,
      requests: { cpu: "1", memory: "1", pods: "1" },
      limits: { cpu: "1", memory: "1", pods: "1" },
      podsRequests: [],
    },
    status: node.status,
    metrics: {
      // TODO: remove this field
      isMetricServerEnabled: false,
      cpu: [],
      memory: [],
    },
  };
};

export const k8sToKalmDockerRegistry = (ns: DockerRegistry): Registry => {
  return {
    name: ns.metadata.name,
    username: "*****",
    password: "*****",
    host: "",
    poolingIntervalSeconds: ns.spec.poolingIntervalSeconds || 0,
    authenticationVerified: ns.status && !!ns.status.authenticationVerified,
    repositories: ns.status ? ns.status.repositories || [] : [],
  };
};

export const kalmToK8sDockerRegistry = (registry: { name: string; host: string }): DockerRegistry => {
  return {
    kind: "DockerRegistry",
    apiVersion: "core.kalm.dev/v1alpha1",
    metadata: { name: registry.name },
    spec: {
      host: registry.host,
    },
    status: {},
  };
};
