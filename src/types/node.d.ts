declare module kubernetes {
  declare module Node {
    export interface List {
      kind: string;
      apiVersion: string;
      metadata: ListMetadata;
      items: Item[];
    }

    export interface Item {
      metadata: Metadata;
      spec: Spec;
      status: Status;
    }

    export interface Spec {
      podCIDR: string;
      providerID: string;
      taints?: {
        key: string;
        effect: string;
      }[];
    }

    export interface Capacity {
      cpu: string;
      memory: string;
      pods: string;
      [key: string]: string;
    }

    export interface Allocatable extends Capacity {}

    export interface Condition {
      type: string;
      status: string;
      lastHeartbeatTime: string;
      lastTransitionTime: string;
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

    export interface Status {
      capacity: Capacity;
      allocatable: Allocatable;
      conditions: Condition[];
      addresses: Address[];
      daemonEndpoints: DaemonEndpoints;
      nodeInfo: NodeInfo;
      images: Image[];
      volumesInUse?: string[];
      volumesAttached?: {
        name: string;
        devicePath: string;
      }[];
    }
  }
}
