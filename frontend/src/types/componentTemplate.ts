import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import { PluginType } from "./plugin";

export type WorkloadType = string;
export const workloadTypeServer: WorkloadType = "server";
export const workloadTypeCronjob: WorkloadType = "cronjob";

export const newEmptyComponentLike = (): ComponentLike => {
  return Immutable.Map({
    name: "",
    image: "",
    replicas: 1,
    workloadType: "server",
    dnsPolicy: "ClusterFirst",
  });
};

export type ComponentLikeEnv = ImmutableMap<{
  name: string;
  type: string;
  value: string;
}>;

export type ComponentLikePort = ImmutableMap<{
  name: string;
  protocol: string;
  containerPort: number;
  servicePort: number;
}>;

export type NodeSelectorLabels = ImmutableMap<{
  [key: string]: string;
}>;

export type PodAffinityType = string;
export const PodAffinityTypePreferFanout: PodAffinityType = "prefer-fanout"; // multi host
export const PodAffinityTypePreferGather: PodAffinityType = "prefer-gather"; //same host

export type VolumeType = string;
export const VolumeTypeTemporaryMemory: VolumeType = "emptyDirMemory";
export const VolumeTypeTemporaryDisk: VolumeType = "emptyDir";
export const VolumeTypePersistentVolumeClaim: VolumeType = "pvc";

// derivative
// export const VolumeTypePersistentVolumeClaimNew: VolumeType = "pvc-new";
// export const VolumeTypePersistentVolumeClaimExisting: VolumeType = "pvc-existing";

export interface VolumeContent {
  type: VolumeType;
  path: string;
  size: string;
  storageClassName: string;
  persistentVolumeClaimName: string;
}

export type PreInjectedFile = ImmutableMap<{
  content: string;
  mountPath: string;
  base64?: boolean;
  readonly?: boolean;
}>;

export type Volume = ImmutableMap<VolumeContent>;

export type ConfigMount = ImmutableMap<{
  paths: Immutable.List<string>;
  mountPath: string;
}>;

export type HttpHeader = ImmutableMap<{
  name: string;
  value: string;
}>;

export type HttpHeaders = Immutable.List<HttpHeader>;

export type Probe = ImmutableMap<{
  exec?: ImmutableMap<{
    command?: Immutable.List<string>;
  }>;

  httpGet?: ImmutableMap<{
    host?: string;
    httpHeaders?: HttpHeaders;
    path?: string;
    port: number | string;
    scheme?: string;
  }>;

  tcpSocket?: ImmutableMap<{
    host?: string;
    port: number | string;
  }>;

  initialDelaySeconds?: number;
  timeoutSeconds?: number;
  periodSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
}>;

export interface ComponentLikeContent {
  name: string;
  image: string;
  replicas: number;
  command?: string;
  cpu?: string;
  memory?: string;
  workloadType?: WorkloadType;
  schedule?: string;
  restartStrategy?: string;
  terminationGracePeriodSeconds?: number;
  dnsPolicy: string;
  env?: Immutable.List<ComponentLikeEnv>;
  ports?: Immutable.List<ComponentLikePort>;
  volumes?: Immutable.List<Volume>;
  configs?: Immutable.List<ConfigMount>;
  plugins?: Immutable.List<PluginType>;
  preInjectedFiles?: Immutable.List<PreInjectedFile>;
  livenessProbe?: Probe;
  ReadinessProbe?: Probe;
  nodeSelectorLabels?: NodeSelectorLabels;
  podAffinityType?: PodAffinityType;
}

export type ComponentLike = ImmutableMap<ComponentLikeContent>;
