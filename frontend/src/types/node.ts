import { ImmutableMap } from "typings";
import Immutable from "immutable";
import { Metrics } from "./common";

export const LOAD_NODES_PENDING = "LOAD_NODES_PENDING";
export const LOAD_NODES_FULFILlED = "LOAD_NODES_FULFILlED";
export const LOAD_NODES_FAILED = "LOAD_NODES_FAILED";

export type ResourceList = ImmutableMap<{
  cpu: string;
  memory: string;
  pods: string;
  [key: string]: string;
}>;

export interface NodeContent {
  name: string;
  creationTimestamp: number;
  labels: ImmutableMap<{ [key: string]: string }>;
  annotations: ImmutableMap<{ [key: string]: string }>;
  roles: Immutable.List<string>;
  statusTexts: Immutable.List<string>;
  internalIP: string;
  externalIP: string;
  allocatedResources: ImmutableMap<{
    podsCount: number;
    requests: ResourceList;
    limits: ResourceList;
  }>;
  status: ImmutableMap<{
    capacity: ResourceList;
    allocatable: ResourceList;
    addresses: Immutable.List<
      ImmutableMap<{
        type: string;
        address: string;
      }>
    >;
    conditions: Immutable.List<
      ImmutableMap<{
        type: string;
        status: string;
        lastHeartbeatTime: string;
        lastTransitionTime: string;
        reason: string;
        message: string;
      }>
    >;
    nodeInfo: ImmutableMap<{
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
    }>;
    images: Immutable.List<
      ImmutableMap<{
        names: Immutable.List<string>;
        sizeBytes: number;
      }>
    >;
  }>;
  metrics: Metrics;
}

export type NodesListResponse = ImmutableMap<{
  nodes: Immutable.List<Node>;
  metrics: Metrics;
}>;

export type Node = ImmutableMap<NodeContent>;

export interface LoadNodesAction {
  type: typeof LOAD_NODES_FULFILlED;
  payload: NodesListResponse;
}

export interface NodeStateAction {
  type: typeof LOAD_NODES_PENDING | typeof LOAD_NODES_FAILED;
}

export type NodeActions = LoadNodesAction | NodeStateAction;
