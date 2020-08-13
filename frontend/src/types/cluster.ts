import { ImmutableMap } from "typings";
import { SSOConfig } from "types/sso";

export const LOAD_CLUSTER_INFO_PENDING = "LOAD_CLUSTER_INFO_PENDING";
export const LOAD_CLUSTER_INFO_FULFILlED = "LOAD_CLUSTER_INFO_FULFILlED";
export const LOAD_CLUSTER_INFO_FAILED = "LOAD_CLUSTER_INFO_FAILED";

export interface ClusterInfoContent {
  ingressIP: string;
  ingressHostname: string;
  httpPort: number;
  httpsPort: number;
  tlsPort: number;
  version: string;
  canBeInitialized: boolean;
  isProduction: boolean;
}

export type TemporaryAdmin = ImmutableMap<{
  username: string;
  password: string;
  email: string;
}>;

export type InitializeClusterResponse = ImmutableMap<{
  clusterInfo: ClusterInfo;
  temporaryAdmin: TemporaryAdmin;
  sso: SSOConfig;
}>;

export type ClusterInfo = ImmutableMap<ClusterInfoContent>;

export interface LoadClusterInfoFulfilledAction {
  type: typeof LOAD_CLUSTER_INFO_FULFILlED;
  payload: ClusterInfo;
}

export interface LoadClusterInfoStatusAction {
  type: typeof LOAD_CLUSTER_INFO_PENDING | typeof LOAD_CLUSTER_INFO_FAILED;
}

export type ClusterActions = LoadClusterInfoStatusAction | LoadClusterInfoFulfilledAction;
