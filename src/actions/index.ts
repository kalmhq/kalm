import { CallHistoryMethodAction } from "connected-react-router";
import Immutable from "immutable";
import { VariantType } from "notistack";
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { V1Node, V1PersistentVolume } from "../model/models";
import { RootState } from "../reducers";
import { ImmutableMap } from "../typings";
import "./node";
import "./notification";
import { SettingObject } from "../reducers/settings";

export const CREATE_COMPONENT = "CREATE_COMPONENT";
export const UPDATE_COMPONENT = "UPDATE_COMPONENT";
export const DELETE_COMPONENT = "DELETE_COMPONENT";
export const DUPLICATE_COMPONENT = "DUPLICATE_COMPONENT";
export const LOAD_COMPONENT_TEMPLATES_PENDING = "LOAD_COMPONENT_TEMPLATES_PENDING";
export const LOAD_COMPONENT_TEMPLATES_FULFILLED = "LOAD_COMPONENT_TEMPLATES_FULFILLED";

export const CREATE_APPLICATION = "CREATE_APPLICATION";
export const UPDATE_APPLICATION = "UPDATE_APPLICATION";
export const DELETE_APPLICATION = "DELETE_APPLICATION";
export const DUPLICATE_APPLICATION = "DUPLICATE_APPLICATION";
export const LOAD_APPLICATIONS_PENDING = "LOAD_APPLICATIONS_PENDING";
export const LOAD_APPLICATIONS_FULFILLED = "LOAD_APPLICATIONS_FULFILLED";

export const CREATE_CONFIG = "CREATE_CONFIG";
export const DUPLICATE_CONFIG = "DUPLICATE_CONFIG";
export const UPDATE_CONFIG = "UPDATE_CONFIG";
export const DELETE_CONFIG = "DELETE_CONFIG";
export const SET_CURRENT_CONFIG_ID_CHAIN = "SET_CURRENT_CONFIG_ID_CHAIN";

export const LOAD_NODES = "LOAD_NODES";
export const LOAD_PERSISTENT_VOLUMNS = "LOAD_PERSISTENT_VOLUMNS";

export const SET_NOTIFICATION_MESSAGE = "SET_NOTIFICATION_MESSAGE";

export const SET_SETTINGS = "SET_SETTINGS";

export const EnvTypeExternal = "external";
export const EnvTypeStatic = "static";
export const EnvTypeLinked = "linked";

export const newEmptyComponentLike = (): ComponentTemplate => {
  return Immutable.Map({
    id: "",
    name: "",
    image: "",
    command: "",
    env: Immutable.List([]),
    ports: Immutable.List([]),
    disk: Immutable.List([]),
    cpu: "100M",
    memory: "100M",
    workloadType: "server"
  });
};

export const newEmptyComponentLikePort = (): ComponentTemplatePort => {
  return Immutable.Map({
    name: "",
    protocol: "TCP",
    containerPort: 3000,
    servicePort: 80
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

export type WorkloadType = string;
export const workloadTypeServer: WorkloadType = "server";
export const workloadTypeCronjob: WorkloadType = "cronjob";

export type Status =
  | typeof StatusTypeRunning
  | typeof StatusTypePending
  | typeof StatusTypeCreating
  | typeof StatusTypeError;

export type ComponentStatus = {
  status: Status;
  deploymentStatus: any;
};

export type ComponentTemplatePort = ImmutableMap<{
  name: string;
  protocol: string;
  containerPort: number;
  servicePort: number;
}>;

export interface ComponentLikeContent {
  name: string;
  image: string;
  command: string;
  cpu: string;
  memory: string;
  workloadType?: WorkloadType;
  schedule?: string;
  env: Immutable.List<
    ImmutableMap<{
      name: string;
      type: string;
      value: string;
    }>
  >;
  ports: Immutable.List<ComponentTemplatePort>;
  disks: Immutable.List<
    ImmutableMap<{
      name: string;
      type: string;
      path: string;
      existDisk: string;
      size: string;
      storageClass: string;
    }>
  >;
}

export interface ApplicationContent {
  id: string;
  isActive: boolean;
  name: string;
  namespace: string;
  sharedEnv: Immutable.List<SharedEnv>;
  components: Immutable.List<ApplicationComponent>;
  status: ApplicationStatus;
  resourceVersion?: string;
}

export interface ApplicationStatusContent {
  status: Status;
  components: Immutable.List<ComponentStatus>;
}

export interface ApplicationComponentContent extends ComponentLikeContent {}

export interface ComponentTemplateContent extends ComponentLikeContent {
  id: string;
  resourceVersion?: string;
}

export type ComponentLike = ImmutableMap<ComponentLikeContent>;
export type ComponentTemplate = ImmutableMap<ComponentTemplateContent>;
export type ApplicationComponent = ImmutableMap<ApplicationComponentContent>;
export type Application = ImmutableMap<ApplicationContent>;
export type ApplicationStatus = ImmutableMap<ApplicationStatusContent>;

export type Config = ImmutableMap<{
  id: string;
  type: "folder" | "file";
  name: string;
  content: string;
  children: Immutable.OrderedMap<string, Config>;
  ancestorIds?: Immutable.List<string>;
}>;

export interface createComponentTemplateAction {
  type: typeof CREATE_COMPONENT;
  payload: {
    componentTemplate: ComponentTemplate;
  };
}

export interface UpdateComponentAction {
  type: typeof UPDATE_COMPONENT;
  payload: {
    componentTemplateId: string;
    componentTemplate: ComponentTemplate;
  };
}

export interface DeleteComponentAction {
  type: typeof DELETE_COMPONENT;
  payload: {
    componentTemplateId: string;
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

export interface LoadApplicationsPendingAction {
  type: typeof LOAD_APPLICATIONS_PENDING;
}

export interface LoadApplicationsFulfilledAction {
  type: typeof LOAD_APPLICATIONS_FULFILLED;
  payload: {
    applications: Array<Application>;
  };
}

export interface CreateConfigAction {
  type: typeof CREATE_CONFIG;
  payload: {
    config: Config;
  };
}

export interface DuplicateConfigAction {
  type: typeof DUPLICATE_CONFIG;
  payload: {
    config: Config;
  };
}

export interface UpdateConfigAction {
  type: typeof UPDATE_CONFIG;
  payload: {
    config: Config;
  };
}

export interface DeleteConfigAction {
  type: typeof DELETE_CONFIG;
  payload: {
    config: Config;
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

export interface SetSettingsAction {
  type: typeof SET_SETTINGS;
  payload: Partial<SettingObject>;
}

export type Actions =
  | createComponentTemplateAction
  | DeleteComponentAction
  | UpdateComponentAction
  | LoadComponentTemplatesFulfilledAction
  | LoadComponentTemplatesPendingAction
  | CreateApplicationAction
  | DeleteApplicationAction
  | UpdateApplicationAction
  | LoadApplicationsFulfilledAction
  | LoadApplicationsPendingAction
  | CreateConfigAction
  | DeleteConfigAction
  | UpdateConfigAction
  | DuplicateConfigAction
  | UpdateCurrentConfigIdChain
  | SetNotificationMessageAction
  | CallHistoryMethodAction
  | DuplicateComponentAction
  | DuplicateApplicationAction
  | LoadNodesAction
  | LoadPersistentVolumnsAction
  | SetSettingsAction;

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;
export type TDispatch = ThunkDispatch<RootState, undefined, Actions>;
export type TDispatchProp = { dispatch: TDispatch };
