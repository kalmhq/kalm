import { CallHistoryMethodAction } from "connected-react-router";
import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import { RootState } from "../reducers";
import { ThunkAction } from "redux-thunk";
import { VariantType } from "notistack";

import "./notification";

export const CREATE_COMPONENT_ACTION = "CREATE_COMPONENT_ACTION";
export const UPDATE_COMPONENT_ACTION = "UPDATE_COMPONENT_ACTION";
export const DELETE_COMPONENT_ACTION = "DELETE_COMPONENT_ACTION";

export const CREATE_APPLICATION_ACTION = "CREATE_APPLICATION_ACTION";
export const UPDATE_APPLICATION_ACTION = "UPDATE_APPLICATION_ACTION";
export const DELETE_APPLICATION_ACTION = "DELETE_APPLICATION_ACTION";

export const CREATE_CONFIG_ACTION = "CREATE_CONFIG_ACTION";
export const UPDATE_CONFIG_ACTION = "UPDATE_CONFIG_ACTION";
export const DELETE_CONFIG_ACTION = "DELETE_CONFIG_ACTION";

export const SET_NOTIFICATION_MESSAGE_ACTION =
  "SET_NOTIFICATION_MESSAGE_ACTION";

export type ComponentFormValues = ImmutableMap<{
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
}>;

export const newEmptyComponentFormValues = (): ComponentFormValues => {
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

export type ApplicationFormValues = ImmutableMap<{
  id: string;
  name: string;
  sharedEnv: Immutable.List<SharedEnv>;
  components: Immutable.List<ComponentFormValues>;
}>;

export interface ConfigFormValues {
  id: string;
  parentId: string;
  type: string;
  name: string;
  value: string;
}

export interface CreateComponentAction {
  type: typeof CREATE_COMPONENT_ACTION;
  payload: {
    componentValues: ComponentFormValues;
  };
}

export interface UpdateComponentAction {
  type: typeof UPDATE_COMPONENT_ACTION;
  payload: {
    componentId: string;
    componentValues: ComponentFormValues;
  };
}

export interface DeleteComponentAction {
  type: typeof DELETE_COMPONENT_ACTION;
  payload: {
    componentId: string;
  };
}

export interface CreateApplicationAction {
  type: typeof CREATE_APPLICATION_ACTION;
  payload: {
    applicationValues: ApplicationFormValues;
  };
}

export interface UpdateApplicationAction {
  type: typeof UPDATE_APPLICATION_ACTION;
  payload: {
    applicationId: string;
    applicationValues: ApplicationFormValues;
  };
}

export interface DeleteApplicationAction {
  type: typeof DELETE_APPLICATION_ACTION;
  payload: {
    applicationId: string;
  };
}

export interface CreateConfigAction {
  type: typeof CREATE_CONFIG_ACTION;
  payload: {
    config: ConfigFormValues;
  };
}

export interface UpdateConfigAction {
  type: typeof UPDATE_CONFIG_ACTION;
  payload: {
    configId: string;
    config: ConfigFormValues;
  };
}

export interface DeleteConfigAction {
  type: typeof DELETE_CONFIG_ACTION;
  payload: {
    configId: string;
  };
}

export interface SetNotificationMessageAction {
  type: typeof SET_NOTIFICATION_MESSAGE_ACTION;
  payload: {
    message: string;
    variant: VariantType;
  };
}

export type Actions =
  | CreateComponentAction
  | DeleteComponentAction
  | UpdateComponentAction
  | CreateApplicationAction
  | DeleteApplicationAction
  | UpdateApplicationAction
  | CreateConfigAction
  | DeleteConfigAction
  | UpdateConfigAction
  | SetNotificationMessageAction
  | CallHistoryMethodAction;

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;
