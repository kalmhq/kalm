import { CallHistoryMethodAction } from "connected-react-router";
import { VariantType } from "notistack";
import { ImmutableMap } from "../typings";
import { SettingObject } from "../reducers/settings";
import { NamespaceActions } from "./namespace";
import { LoginStatus } from "./authorization";

export const LOAD_LOGIN_STATUS = "LOAD_LOGIN_STATUS";
export const SET_AUTH_TOKEN = "SET_AUTH_TOKEN";

export const LOAD_NODES = "LOAD_NODES";
export const LOAD_PERSISTENT_VOLUMNS = "LOAD_PERSISTENT_VOLUMNS";

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

export const StatusTypeRunning = "RUNNING";
export const StatusTypePending = "PENDING";
export const StatusTypeCreating = "CREATING";
export const StatusTypeError = "Error";

export type Status =
  | typeof StatusTypeRunning
  | typeof StatusTypePending
  | typeof StatusTypeCreating
  | typeof StatusTypeError;

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
    nodes: any[];
  };
}

export interface LoadPersistentVolumnsAction {
  type: typeof LOAD_PERSISTENT_VOLUMNS;
  payload: {
    persistentVolumns: any[];
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

export interface LoadLoginStatusAction {
  type: typeof LOAD_LOGIN_STATUS;
  payload: {
    loginStatus: LoginStatus;
  };
}

export interface SetAuthTokenAction {
  type: typeof SET_AUTH_TOKEN;
  payload: {
    token: string;
  };
}

export type CommonActions =
  | SetAuthTokenAction
  | LoadLoginStatusAction
  | SetNotificationMessageAction
  | CallHistoryMethodAction
  | LoadNodesAction
  | LoadPersistentVolumnsAction
  | SetSettingsAction
  | InitControlledDialogAction
  | DestroyControlledDialogAction
  | OpenControlledDialogAction
  | CloseControlledDialogAction
  | NamespaceActions;
