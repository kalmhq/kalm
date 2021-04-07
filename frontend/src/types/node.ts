import { Metrics } from "./common";

export const LOAD_NODES_PENDING = "LOAD_NODES_PENDING";
export const LOAD_NODES_FULFILLED = "LOAD_NODES_FULFILLED";
export const LOAD_NODES_FAILED = "LOAD_NODES_FAILED";

type ResourceList = {
  cpu: string;
  memory: string;
  pods: string;
  [key: string]: string;
};

export interface Node {
  name: string;
  creationTimestamp: number;
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
  roles: string[];
  statusTexts: string[];
  internalIP: string;
  externalIP: string;
  allocatedResources: {
    podsCount: number;
    requests: ResourceList;
    limits: ResourceList;
    podsRequests: {
      podName: string;
      namespace: string;
      requests: ResourceList;
    }[];
  };
  status: {
    capacity: ResourceList;
    allocatable: ResourceList;
    addresses: {
      type: string;
      address: string;
    }[];
    conditions: {
      type: string;
      status: string;
      lastHeartbeatTime: string;
      lastTransitionTime: string;
      reason: string;
      message: string;
    }[];
    nodeInfo: {
      machineID: string;
      systemUUID: string;
      bootID: string;
      kernelVersion: string;
      osImage: string;
      containerRuntimeVersion: string;
      kubeletVersion: string;
      kubeProxyVersion: string;
      operatingSystem: string;
      architecture: string;
    };
    images: {
      names: string[];
      sizeBytes: number;
    }[];
  };
  metrics: Metrics;
}

type NodesListResponse = {
  nodes: Node[];
  metrics: Metrics;
};

interface LoadNodesAction {
  type: typeof LOAD_NODES_FULFILLED;
  payload: NodesListResponse;
}

interface NodeStateAction {
  type: typeof LOAD_NODES_PENDING | typeof LOAD_NODES_FAILED;
}

export type NodeActions = LoadNodesAction | NodeStateAction;
