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
import { KappDependency } from "../types";
import { ApplicationActions } from "../types/application";

export const INIT_AUTH = "INIT_AUTH";
export const SET_AUTH_TOKEN = "SET_AUTH_TOKEN";

export const CREATE_COMPONENT = "CREATE_COMPONENT";
export const UPDATE_COMPONENT = "UPDATE_COMPONENT";
export const DELETE_COMPONENT = "DELETE_COMPONENT";
export const DUPLICATE_COMPONENT = "DUPLICATE_COMPONENT";
export const LOAD_COMPONENT_TEMPLATES_PENDING = "LOAD_COMPONENT_TEMPLATES_PENDING";
export const LOAD_COMPONENT_TEMPLATES_FULFILLED = "LOAD_COMPONENT_TEMPLATES_FULFILLED";

export const CREATE_CONFIG = "CREATE_CONFIG";
export const DUPLICATE_CONFIG = "DUPLICATE_CONFIG";
export const UPDATE_CONFIG = "UPDATE_CONFIG";
export const DELETE_CONFIG = "DELETE_CONFIG";
export const SET_CURRENT_CONFIG_ID_CHAIN = "SET_CURRENT_CONFIG_ID_CHAIN";
export const LOAD_CONFIGS_PENDING = "LOAD_CONFIGS_PENDING";
export const LOAD_CONFIGS_FULFILLED = "LOAD_CONFIGS_FULFILLED";

export const LOAD_USERS_PENDING = "LOAD_USERS_PENDING";
export const LOAD_USERS_FULFILLED = "LOAD_USERS_FULFILLED";

export const LOAD_NODES = "LOAD_NODES";
export const LOAD_PERSISTENT_VOLUMNS = "LOAD_PERSISTENT_VOLUMNS";

export const LOAD_DEPENDENCIES_PENDING = "LOAD_DEPENDENCIES_PENDING";
export const LOAD_DEPENDENCIES_FULFILLED = "LOAD_DEPENDENCIES_FULFILLED";

export const SET_NOTIFICATION_MESSAGE = "SET_NOTIFICATION_MESSAGE";

export const SET_SETTINGS = "SET_SETTINGS";

export const INIT_CONTROLLED_DIALOG = "INIT_CONTROLLED_DIALOG";
export const DESTROY_CONTROLLED_DIALOG = "DESTROY_CONTROLLED_DIALOG";
export const OPEN_CONTROLLED_DIALOG = "OPEN_CONTROLLED_DIALOG";
export const CLOSE_CONTROLLED_DIALOG = "CLOSE_CONTROLLED_DIALOG";

export const EnvTypeExternal = "external";
export const EnvTypeStatic = "static";
export const EnvTypeLinked = "linked";

export const portTypeTCP = "TCP";
export const portTypeUDP = "UDP";

export type ControlledDialogParams<T> = ImmutableMap<{
  open: boolean;
  data: T;
}>;

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

export type ConfigFile = ImmutableMap<{
  id: string;
  name: string;
  path: string;
  content: string;
  resourceVersion?: string;
}>;

export type ConfigNode = ImmutableMap<{
  id: string; // for folder is split path, for file is name in metadata
  resourceVersion?: string;
  type: "folder" | "file";
  name: string; // split path
  content: string;
  children: Immutable.OrderedMap<string, ConfigNode>;
  ancestorIds?: Immutable.List<string>;
}>;

export const clusterRoleNames = [
  "application_editor_role",
  "application_viewer_role",
  "component_editor_role",
  "component_viewer_role",
  "file_editor_role",
  "file_viewer_role",
  "dependency_editor_role",
  "dependency_viewer_role"
];

export type ClusterRoleName =
  | "application_editor_role"
  | "application_viewer_role"
  | "component_editor_role"
  | "component_viewer_role"
  | "file_editor_role"
  | "file_viewer_role"
  | "dependency_editor_role"
  | "dependency_viewer_role";

export interface UserInterface {
  name: string;
  type: "serviceAccount" | "oidc";
  token?: string;
  clusterRoleNames: ClusterRoleName[];
}

export type User = ImmutableMap<UserInterface>;

export interface createComponentTemplateAction {
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

export interface LoadConfigsPendingAction {
  type: typeof LOAD_CONFIGS_PENDING;
}

export interface LoadConfigsFulfilledAction {
  type: typeof LOAD_CONFIGS_FULFILLED;
  payload: {
    configNode: ConfigNode;
  };
}

export interface LoadUsersPendingAction {
  type: typeof LOAD_USERS_PENDING;
}

export interface LoadUsersFulfilledAction {
  type: typeof LOAD_USERS_FULFILLED;
  payload: {
    users: Immutable.OrderedMap<string, User>;
  };
}

export interface CreateConfigAction {
  type: typeof CREATE_CONFIG;
  payload: {
    config: ConfigNode;
  };
}

export interface DuplicateConfigAction {
  type: typeof DUPLICATE_CONFIG;
  payload: {
    config: ConfigNode;
  };
}

export interface UpdateConfigAction {
  type: typeof UPDATE_CONFIG;
  payload: {
    config: ConfigNode;
  };
}

export interface DeleteConfigAction {
  type: typeof DELETE_CONFIG;
  payload: {
    config: ConfigNode;
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

export interface InitControlledDialogAction {
  type: typeof INIT_CONTROLLED_DIALOG;
  payload: {
    dialogID: string;
  };
}
export interface DestroyControlledDialogAction {
  type: typeof DESTROY_CONTROLLED_DIALOG;
  payload: {
    dialogID: string;
  };
}
export interface OpenControlledDialogAction {
  type: typeof OPEN_CONTROLLED_DIALOG;
  payload: {
    dialogID: string;
    data: any;
  };
}

export interface CloseControlledDialogAction {
  type: typeof CLOSE_CONTROLLED_DIALOG;
  payload: {
    dialogID: string;
  };
}

export interface LoadDependenciesPendingAction {
  type: typeof LOAD_DEPENDENCIES_PENDING;
}

export interface LoadDependenciesFulfilledAction {
  type: typeof LOAD_DEPENDENCIES_FULFILLED;
  payload: {
    dependencies: Array<KappDependency>;
  };
}

export interface InitAuthAction {
  type: typeof INIT_AUTH;
  payload: {
    authorized: boolean;
  };
}

export interface SetAuthTokenAction {
  type: typeof SET_AUTH_TOKEN;
  payload: {
    token: string;
  };
}

export type Actions =
  | SetAuthTokenAction
  | InitAuthAction
  | createComponentTemplateAction
  | DeleteComponentAction
  | UpdateComponentAction
  | LoadComponentTemplatesFulfilledAction
  | LoadComponentTemplatesPendingAction
  | LoadConfigsFulfilledAction
  | LoadConfigsPendingAction
  | LoadUsersPendingAction
  | LoadUsersFulfilledAction
  | CreateConfigAction
  | DeleteConfigAction
  | UpdateConfigAction
  | DuplicateConfigAction
  | UpdateCurrentConfigIdChain
  | SetNotificationMessageAction
  | CallHistoryMethodAction
  | DuplicateComponentAction
  | LoadNodesAction
  | LoadPersistentVolumnsAction
  | SetSettingsAction
  | InitControlledDialogAction
  | DestroyControlledDialogAction
  | OpenControlledDialogAction
  | CloseControlledDialogAction
  | LoadDependenciesPendingAction
  | LoadDependenciesFulfilledAction
  | ApplicationActions;

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;
export type TDispatch = ThunkDispatch<RootState, undefined, Actions>;
export type TDispatchProp = { dispatch: TDispatch };
