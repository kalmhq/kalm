import { CallHistoryMethodAction } from "connected-react-router";
import Immutable from "immutable";
import { VariantType } from "notistack";
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { V1Node, V1PersistentVolume } from "../model/models";
import { RootState } from "../reducers";
import { ImmutableMap } from "../typings";
import "./node";
import "./notification";

export const CREATE_COMPONENT = "CREATE_COMPONENT";
export const UPDATE_COMPONENT = "UPDATE_COMPONENT";
export const DELETE_COMPONENT = "DELETE_COMPONENT";
export const DUPLICATE_COMPONENT = "DUPLICATE_COMPONENT";
export const LOAD_COMPONENT_TEMPLATES =
  "LOAD_COMPONENT_TEMPLATES";

export const CREATE_APPLICATION = "CREATE_APPLICATION";
export const UPDATE_APPLICATION = "UPDATE_APPLICATION";
export const DELETE_APPLICATION = "DELETE_APPLICATION";
export const DUPLICATE_APPLICATION = "DUPLICATE_APPLICATION";

export const CREATE_CONFIG = "CREATE_CONFIG";
export const UPDATE_CONFIG = "UPDATE_CONFIG";
export const DELETE_CONFIG = "DELETE_CONFIG";
export const SET_CURRENT_CONFIG_ID_CHAIN = "SET_CURRENT_CONFIG_ID_CHAIN";

export const LOAD_NODES = "LOAD_NODES";
export const LOAD_PERSISTENT_VOLUMNS = "LOAD_PERSISTENT_VOLUMNS";

export const SET_NOTIFICATION_MESSAGE =
  "SET_NOTIFICATION_MESSAGE";

export type Component = ImmutableMap<{
  id: string;
  name: string;
  image: string;
  command: string;
  env: Immutable.List<
    ImmutableMap<{
      name: string;
      type: string;
      value: string;
    }>
  >;
  ports: Immutable.List<
    ImmutableMap<{
      name: string;
      protocol: string;
      containerPort: number;
      servicePort: number;
    }>
  >;
  cpu: number;
  memory: number;
  disk: Immutable.List<
    ImmutableMap<{
      name: string;
      type: string;
      path: string;
      existDisk: string;
      size: string;
      storageClass: string;
    }>
  >;
  resourceVersion?: string;
}>;

export const newEmptyComponent = (): Component => {
  return Immutable.Map({
    id: "",
    name: "",
    image: "",
    command: "",
    env: Immutable.List([]),
    ports: Immutable.List([]),
    disk: Immutable.List([]),
    cpu: 0,
    memory: 0
  });
};

export type SharedEnv = ImmutableMap<{
  name: string;
  type: string;
  value: string;
}>;

export type EnvItem = SharedEnv;
export type EnvItems = Immutable.List<EnvItem>;

export const StatusTypeRunning = "RUNNING";
export const StatusTypePending = "PENDING";
export const StatusTypeCreating = "CREATING";
export const StatusTypeError = "Error";

export type Status =
  | typeof StatusTypeRunning
  | typeof StatusTypePending
  | typeof StatusTypeCreating
  | typeof StatusTypeError;

export type ComponentStatus = {
  status: Status;
};

export type ApplicationStatus = ImmutableMap<{
  status: Status;
  components: Immutable.List<ComponentStatus>;
}>;

export type Application = ImmutableMap<{
  id: string;
  name: string;
  isEnabled: boolean;
  sharedEnv: Immutable.List<SharedEnv>;
  components: Immutable.List<Component>;
  status: ApplicationStatus;
}>;

export type Config = ImmutableMap<{
  id: string;
  type: "folder" | "file";
  name: string;
  content: string;
  children: Immutable.OrderedMap<string, Config>;
}>;

export interface createComponentTemplateAction {
  type: typeof CREATE_COMPONENT;
  payload: {
    component: Component;
  };
}

export interface UpdateComponentAction {
  type: typeof UPDATE_COMPONENT;
  payload: {
    componentId: string;
    component: Component;
  };
}

export interface DeleteComponentAction {
  type: typeof DELETE_COMPONENT;
  payload: {
    componentId: string;
  };
}
export interface DuplicateComponentAction {
  type: typeof DUPLICATE_COMPONENT;
  payload: {
    componentId: string;
  };
}

export interface LoadComponentTemplatesAction {
  type: typeof LOAD_COMPONENT_TEMPLATES;
  payload: {
    components: Array<Component>;
  };
}

export interface CreateApplicationAction {
  type: typeof CREATE_APPLICATION;
  payload: {
    applicationValues: Application;
  };
}

export interface UpdateApplicationAction {
  type: typeof UPDATE_APPLICATION;
  payload: {
    applicationId: string;
    applicationValues: Application;
  };
}

export interface DeleteApplicationAction {
  type: typeof DELETE_APPLICATION;
  payload: {
    applicationId: string;
  };
}

export interface DuplicateApplicationAction {
  type: typeof DUPLICATE_APPLICATION;
  payload: {
    applicationId: string;
  };
}

export interface CreateConfigAction {
  type: typeof CREATE_CONFIG;
  payload: {
    config: Config;
  };
}

export interface UpdateConfigAction {
  type: typeof UPDATE_CONFIG;
  payload: {
    configId: string;
    config: Config;
  };
}

export interface DeleteConfigAction {
  type: typeof DELETE_CONFIG;
  payload: {
    configId: string;
  };
}

export interface UpdateCurrentConfigIdChain {
  type: typeof SET_CURRENT_CONFIG_ID_CHAIN;
  payload: {
    idChain: string[];
  };
}

export interface SetNotificationMessageAction {
  type: typeof SET_NOTIFICATION_MESSAGE;
  payload: {
    message: string;
    variant: VariantType;
  };
}

export interface LoadNodesAction {
  type: typeof LOAD_NODES;
  payload: {
    nodes: V1Node[];
  };
}

export interface LoadPersistentVolumnsAction {
  type: typeof LOAD_PERSISTENT_VOLUMNS;
  payload: {
    persistentVolumns: V1PersistentVolume[];
  };
}

export type Actions =
  | createComponentTemplateAction
  | DeleteComponentAction
  | UpdateComponentAction
  | LoadComponentTemplatesAction
  | CreateApplicationAction
  | DeleteApplicationAction
  | UpdateApplicationAction
  | CreateConfigAction
  | DeleteConfigAction
  | UpdateConfigAction
  | UpdateCurrentConfigIdChain
  | SetNotificationMessageAction
  | CallHistoryMethodAction
  | DuplicateComponentAction
  | DuplicateApplicationAction
  | LoadNodesAction
  | LoadPersistentVolumnsAction;

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;
export type TDispatch = ThunkDispatch<RootState, undefined, Actions>;
export type TDispatchProp = { dispatch: TDispatch };
