declare module kubernetes {
  export interface NodeList {
    kind: string;
    apiVersion: string;
    metadata: Metadata;
    items: Node[];
  }

  export interface Node {
    metadata: NodeMetadata;
    spec: Spec;
    status: NodeStatus;
  }

  export interface NodeListMetadata {
    selfLink: string;
    resourceVersion: string;
  }

  export interface NodeMetadata {
    name: string;
    selfLink: string;
    uid: string;
    resourceVersion: string;
    creationTimestamp: Date;
    labels: Labels;
    annotations: Annotations;
  }

  export interface Labels {
    [key: string]: string;
  }

  export interface Annotations {
    [key: string]: string;
  }

  export interface Spec {}

  export interface Capacity {
    cpu: string;
    "ephemeral-storage": string;
    "hugepages-1Gi": string;
    "hugepages-2Mi": string;
    memory: string;
    pods: string;
  }

  export interface Allocatable extends Capacity {}

  export interface Condition {
    type: string;
    status: string;
    lastHeartbeatTime: Date;
    lastTransitionTime: Date;
    reason: string;
    message: string;
  }

  export interface Address {
    type: string;
    address: string;
  }

  export interface KubeletEndpoint {
    Port: number;
  }

  export interface DaemonEndpoints {
    kubeletEndpoint: KubeletEndpoint;
  }

  export interface NodeInfo {
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
  }

  export interface Image {
    names: string[];
    sizeBytes: number;
  }

  export interface NodeStatus {
    capacity: Capacity;
    allocatable: Allocatable;
    conditions: Condition[];
    addresses: Address[];
    daemonEndpoints: DaemonEndpoints;
    nodeInfo: NodeInfo;
    images: Image[];
  }
}
