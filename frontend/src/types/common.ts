import { CallHistoryMethodAction } from "connected-react-router";
import { VariantType } from "notistack";
import { SettingObject } from "reducers/settings";
import { LoginStatus } from "./authorization";
import { NamespaceActions } from "./namespace";

export const LOAD_LOGIN_STATUS_PENDING = "LOAD_LOGIN_STATUS_PENDING";
export const LOAD_LOGIN_STATUS_FULFILLED = "LOAD_LOGIN_STATUS_FULFILLED";
export const LOAD_LOGIN_STATUS_FAILED = "LOAD_LOGIN_STATUS_FAILED";
export const SET_AUTH_TOKEN = "SET_AUTH_TOKEN";
const SET_AUTH_METHODS = "SET_AUTH_METHODS";
export const LOGOUT = "LOGOUT";

export const SET_NOTIFICATION_MESSAGE = "SET_NOTIFICATION_MESSAGE";
export const SET_SETTINGS = "SET_SETTINGS";

export const INIT_CONTROLLED_DIALOG = "INIT_CONTROLLED_DIALOG";
export const DESTROY_CONTROLLED_DIALOG = "DESTROY_CONTROLLED_DIALOG";
export const OPEN_CONTROLLED_DIALOG = "OPEN_CONTROLLED_DIALOG";
export const CLOSE_CONTROLLED_DIALOG = "CLOSE_CONTROLLED_DIALOG";
export const CLEAR_CONTROLLED_DIALOG_DATA = "CLEAR_CONTROLLED_DIALOG_DATA";

const EnvTypeExternal = "external";
const EnvTypeStatic = "static";
const EnvTypeLinked = "linked";

export type ControlledDialogParams<T> = {
  open: boolean;
  data: T;
};

type MetricItem = {
  x: number;
  y: number;
};

export type MetricList = MetricItem[];

export type Metrics = {
  isMetricServerEnabled: boolean;
  cpu: MetricList;
  memory: MetricList;
};

const StatusTypeRunning = "RUNNING";
const StatusTypePending = "PENDING";
const StatusTypeCreating = "CREATING";
const StatusTypeError = "Error";

type Status = typeof StatusTypeRunning | typeof StatusTypePending | typeof StatusTypeCreating | typeof StatusTypeError;

interface SetNotificationMessageAction {
  type: typeof SET_NOTIFICATION_MESSAGE;
  payload: {
    message: string;
    variant: VariantType;
  };
}

export interface SetSettingsAction {
  type: typeof SET_SETTINGS;
  payload: Partial<SettingObject>;
}

interface InitControlledDialogAction {
  type: typeof INIT_CONTROLLED_DIALOG;
  payload: {
    dialogID: string;
  };
}

interface DestroyControlledDialogAction {
  type: typeof DESTROY_CONTROLLED_DIALOG;
  payload: {
    dialogID: string;
  };
}

interface OpenControlledDialogAction {
  type: typeof OPEN_CONTROLLED_DIALOG;
  payload: {
    dialogID: string;
    data: any;
  };
}

interface CloseControlledDialogAction {
  type: typeof CLOSE_CONTROLLED_DIALOG;
  payload: {
    dialogID: string;
  };
}

interface ClearControlledDialogAction {
  type: typeof CLEAR_CONTROLLED_DIALOG_DATA;
  payload: {
    dialogID: string;
  };
}

interface LoadLoginStatusAction {
  type: typeof LOAD_LOGIN_STATUS_FULFILLED;
  payload: {
    loginStatus: LoginStatus;
  };
}

interface SetAuthTokenAction {
  type: typeof SET_AUTH_TOKEN;
  payload: {
    token: string;
  };
}

interface LogoutAction {
  type: typeof LOGOUT;
}

interface LoadStatusAction {
  type: typeof LOAD_LOGIN_STATUS_FAILED | typeof LOAD_LOGIN_STATUS_PENDING;
}

export type CommonActions =
  | LogoutAction
  | LoadStatusAction
  | SetAuthTokenAction
  | LoadLoginStatusAction
  | SetNotificationMessageAction
  | CallHistoryMethodAction
  | SetSettingsAction
  | InitControlledDialogAction
  | DestroyControlledDialogAction
  | OpenControlledDialogAction
  | CloseControlledDialogAction
  | ClearControlledDialogAction
  | NamespaceActions;
