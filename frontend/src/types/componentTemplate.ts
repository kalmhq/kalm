import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import { Status } from "./common";

export const CREATE_COMPONENT = "CREATE_COMPONENT";
export const UPDATE_COMPONENT = "UPDATE_COMPONENT";
export const DELETE_COMPONENT = "DELETE_COMPONENT";
export const DUPLICATE_COMPONENT = "DUPLICATE_COMPONENT";
export const LOAD_COMPONENT_TEMPLATES_PENDING = "LOAD_COMPONENT_TEMPLATES_PENDING";
export const LOAD_COMPONENT_TEMPLATES_FULFILLED = "LOAD_COMPONENT_TEMPLATES_FULFILLED";

export type WorkloadType = string;
export const workloadTypeServer: WorkloadType = "server";
export const workloadTypeCronjob: WorkloadType = "cronjob";

export const newEmptyComponentLike = (): ComponentLike => {
  return Immutable.Map({
    name: "",
    image: "",
    command: "",
    env: Immutable.List([]),
    ports: Immutable.List([]),
    disks: Immutable.List([]),
    cpu: "100M",
    memory: "100M",
    workloadType: "server",
    restartStrategy: "rollingUpdate",
    dnsPolicy: "ClusterFirst",
    terminationGracePeriodSeconds: 30
  });
};

export const newEmptyPlugin = (): Plugin => {
  return Immutable.Map({});
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

export type ComponentLikePort = ImmutableMap<{
  name: string;
  protocol: string;
  containerPort: number;
  servicePort: number;
}>;

export interface PluginContent {
  name: string;
  [key: string]: any;
}

export interface ComponentLikeContent {
  name: string;
  image: string;
  command: Immutable.List<string>;
  cpu: string;
  memory: string;
  workloadType?: WorkloadType;
  schedule?: string;
  restartStrategy?: string;
  terminationGracePeriodSeconds?: number;
  dnsPolicy?: string;
  env?: Immutable.List<
    ImmutableMap<{
      name: string;
      type: string;
      value: string;
    }>
  >;
  ports?: Immutable.List<ComponentLikePort>;
  disks?: Immutable.List<
    ImmutableMap<{
      name: string;
      type: string;
      path: string;
      existDisk: string;
      size: string;
      storageClass: string;
    }>
  >;
  plugins?: Immutable.List<Plugin>;
}

export interface ComponentTemplateContent extends ComponentLikeContent {}

export type Plugin = ImmutableMap<PluginContent>;
export type ComponentLike = ImmutableMap<ComponentLikeContent>;
export type ComponentTemplate = ImmutableMap<ComponentTemplateContent>;

export interface CreateComponentTemplateAction {
  type: typeof CREATE_COMPONENT;
  payload: {
    componentTemplate: ComponentTemplate;
  };
}

export interface UpdateComponentAction {
  type: typeof UPDATE_COMPONENT;
  payload: {
    componentTemplate: ComponentTemplate;
  };
}

export interface DeleteComponentAction {
  type: typeof DELETE_COMPONENT;
  payload: {
    componentTemplateName: string;
  };
}
export interface DuplicateComponentAction {
  type: typeof DUPLICATE_COMPONENT;
  payload: {
    componentTemplate: ComponentTemplate;
  };
}

export interface LoadComponentTemplatesPendingAction {
  type: typeof LOAD_COMPONENT_TEMPLATES_PENDING;
}

export interface LoadComponentTemplatesFulfilledAction {
  type: typeof LOAD_COMPONENT_TEMPLATES_FULFILLED;
  payload: {
    componentTemplates: Array<ComponentTemplate>;
  };
}

export type ComponentTemplateActions =
  | CreateComponentTemplateAction
  | DeleteComponentAction
  | UpdateComponentAction
  | LoadComponentTemplatesFulfilledAction
  | LoadComponentTemplatesPendingAction
  | DuplicateComponentAction;
