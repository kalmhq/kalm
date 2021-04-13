import { K8sObject } from "types";
import { Repository } from "types/registry";

export interface Namespace extends K8sObject {}

export interface Deployment extends K8sObject {}

type ResourceList = {
  cpu: string;
  memory: string;
  pods: string;
  [key: string]: string;
};
export interface K8sNode extends K8sObject {
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
}

export interface DockerRegistry extends K8sObject {
  spec: {
    host?: string;
    poolingIntervalSeconds?: number;
  };
  status: {
    authenticationVerified?: boolean;
    repositories?: Repository[];
  };
}

export interface Secret extends K8sObject {
  kind: "Secret";
  apiVersion: "v1";
  data: { [key: string]: string };
}
