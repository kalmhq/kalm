export type WorkloadType = string;
export const workloadTypeServer: WorkloadType = "server";
export const workloadTypeCronjob: WorkloadType = "cronjob";
export const workloadTypeDaemonSet: WorkloadType = "daemonset";
export const workloadTypeStatefulSet: WorkloadType = "statefulset";

export interface ComponentLikeEnv {
  name: string;
  type: string;
  value: string;
}

type PortProtocol = string;

export const PortProtocolHTTP: PortProtocol = "http";
export const PortProtocolHTTPS: PortProtocol = "https";
export const PortProtocolHTTP2: PortProtocol = "http2";
export const PortProtocolGRPC: PortProtocol = "grpc";
export const PortProtocolGRPCWEB: PortProtocol = "grpc-web";
export const PortProtocolTCP: PortProtocol = "tcp";
export const PortProtocolUDP: PortProtocol = "udp";

export interface ComponentLikePort {
  protocol: string;
  containerPort: number;
  servicePort: number;
}

export interface NodeSelectorLabels {
  [key: string]: string;
}

type PodAffinityType = string;

type VolumeType = string;
export const VolumeTypeTemporaryMemory: VolumeType = "emptyDirMemory";
export const VolumeTypeTemporaryDisk: VolumeType = "emptyDir";
export const VolumeTypePersistentVolumeClaim: VolumeType = "pvc";
// for DaemonSet
export const VolumeTypeHostPath: VolumeType = "hostPath";
// for StatefulSet
export const VolumeTypePersistentVolumeClaimTemplate: VolumeType = "pvcTemplate";
export const VolumeTypePersistentVolumeClaimTemplateNew: VolumeType = "pvcTemplate-new";
// derivative
export const VolumeTypePersistentVolumeClaimNew: VolumeType = "pvc-new";

export interface Volume {
  type: VolumeType;
  path: string;
  size: string;
  storageClassName: string;
  // persistentVolumeClaimName: string;
  pvc: string;
  pvToMatch: string;
  // select claimName then pass pvc and pvToMatch
  claimName: string;
  // for daemonset
  hostPath?: string;
}

export interface PreInjectedFile {
  content: string;
  mountPath: string;
  mountPathTmp?: string;
  base64?: boolean;
  readonly?: boolean;
}

interface HttpHeader {
  name: string;
  value: string;
}
export interface Probe {
  exec?: {
    command?: string[];
  };

  httpGet?: {
    host?: string;
    httpHeaders?: HttpHeader[];
    path?: string;
    port: number | string;
    scheme?: string;
  };

  tcpSocket?: {
    host?: string;
    port: number | string;
  };

  initialDelaySeconds?: number;
  timeoutSeconds?: number;
  periodSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
}

export type ResourceRequirements = {
  limits?: {
    cpu?: string;
    memory?: string;
  };

  requests?: {
    cpu?: string;
    memory?: string;
  };
};

export interface ComponentLike {
  name: string;
  image: string;
  replicas: number;
  command?: string;
  resourceRequirements?: ResourceRequirements;
  cpuRequest?: string;
  memoryRequest?: string;
  cpuLimit?: string;
  memoryLimit?: string;
  workloadType?: WorkloadType;
  schedule?: string;
  restartStrategy?: string;
  terminationGracePeriodSeconds?: number;
  dnsPolicy: string;
  env?: ComponentLikeEnv[];
  ports?: ComponentLikePort[];
  volumes?: Volume[];
  preInjectedFiles?: PreInjectedFile[];
  livenessProbe?: Probe;
  readinessProbe?: Probe;
  nodeSelectorLabels?: NodeSelectorLabels;
  preferNotCoLocated?: boolean;
  podAffinityType?: PodAffinityType;
  protectedEndpoint?: {
    ports?: string[];
    groups?: string[];
  };
}

export const newEmptyComponentLike: ComponentLike = {
  name: "",
  image: "",
  replicas: 1,
  workloadType: workloadTypeServer,
  dnsPolicy: "ClusterFirst",
  schedule: "",
  restartStrategy: "RollingUpdate",
};
