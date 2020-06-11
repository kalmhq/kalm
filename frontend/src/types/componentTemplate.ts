import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import { Status } from "./common";
import { PluginType } from "./plugin";
export const CREATE_COMPONENT_TEMPLATES = "CREATE_COMPONENT_TEMPLATES";
export const UPDATE_COMPONENT_TEMPLATES = "UPDATE_COMPONENT_TEMPLATES";
export const DELETE_COMPONENT_TEMPLATES = "DELETE_COMPONENT_TEMPLATES";
export const DUPLICATE_COMPONENT_TEMPLATES = "DUPLICATE_COMPONENT_TEMPLATES";
export const LOAD_COMPONENT_TEMPLATES_PENDING = "LOAD_COMPONENT_TEMPLATES_PENDING";
export const LOAD_COMPONENT_TEMPLATES_FULFILLED = "LOAD_COMPONENT_TEMPLATES_FULFILLED";
export const LOAD_COMPONENT_TEMPLATES_FAILED = "LOAD_COMPONENT_TEMPLATES_FAILED";

export type WorkloadType = string;
export const workloadTypeServer: WorkloadType = "server";
export const workloadTypeCronjob: WorkloadType = "cronjob";

export const newEmptyComponentLike = (): ComponentLike => {
  return Immutable.Map({
    name: "",
    image: "",
    replicas: 1,
    command: Immutable.List([]),
    env: Immutable.List([]),
    ports: Immutable.List([]),
    disks: Immutable.List([]),
    cpu: null,
    memory: null,
    workloadType: "server",
    restartStrategy: "RollingUpdate",
    dnsPolicy: "ClusterFirst",
    terminationGracePeriodSeconds: 30
  });
};

export const newEmptyPlugin = (): PluginType => {
  return Immutable.Map({});
};

export const newEmptyVolume = (): Volume => {
  return Immutable.Map({});
};

export const newEmptyComponentLikeEnv = (): ComponentLikeEnv => {
  return Immutable.Map({
    name: "",
    type: "static",
    value: ""
  });
};

export const newEmptyComponentLikePort = (): ComponentLikePort => {
  return Immutable.Map({
    name: "",
    protocol: "TCP",
    containerPort: 3000,
    servicePort: 80
  });
};

export type ComponentStatus = {
  status: Status;
  deploymentStatus: any;
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
  command: Immutable.List<string>;
  args: Immutable.List<string>;
  cpu: string | null;
  memory: string | null;
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

export interface ComponentTemplateContent extends ComponentLikeContent {}

export type ComponentLike = ImmutableMap<ComponentLikeContent>;
export type ComponentTemplate = ImmutableMap<ComponentTemplateContent>;

export interface CreateComponentTemplateAction {
  type: typeof CREATE_COMPONENT_TEMPLATES;
  payload: {
    componentTemplate: ComponentTemplate;
  };
}

export interface UpdateComponentTemplateAction {
  type: typeof UPDATE_COMPONENT_TEMPLATES;
  payload: {
    componentTemplate: ComponentTemplate;
  };
}

export interface DeleteComponentTemplateAction {
  type: typeof DELETE_COMPONENT_TEMPLATES;
  payload: {
    componentTemplateName: string;
  };
}
export interface DuplicateComponentTemplateAction {
  type: typeof DUPLICATE_COMPONENT_TEMPLATES;
  payload: {
    componentTemplate: ComponentTemplate;
  };
}

export interface LoadComponentTemplatesPendingAction {
  type: typeof LOAD_COMPONENT_TEMPLATES_PENDING;
}

export interface LoadComponentTemplatesFailedAction {
  type: typeof LOAD_COMPONENT_TEMPLATES_FAILED;
}

export interface LoadComponentTemplatesFulfilledAction {
  type: typeof LOAD_COMPONENT_TEMPLATES_FULFILLED;
  payload: {
    componentTemplates: Array<ComponentTemplate>;
  };
}

export type ComponentTemplateActions =
  | CreateComponentTemplateAction
  | DeleteComponentTemplateAction
  | UpdateComponentTemplateAction
  | LoadComponentTemplatesFulfilledAction
  | LoadComponentTemplatesPendingAction
  | LoadComponentTemplatesFailedAction
  | DuplicateComponentTemplateAction;
