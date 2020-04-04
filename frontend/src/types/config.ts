import Immutable from "immutable";
import { ImmutableMap } from "../typings";

export const CREATE_CONFIG = "CREATE_CONFIG";
export const DUPLICATE_CONFIG = "DUPLICATE_CONFIG";
export const UPDATE_CONFIG = "UPDATE_CONFIG";
export const DELETE_CONFIG = "DELETE_CONFIG";
export const SET_CURRENT_CONFIG_ID_CHAIN = "SET_CURRENT_CONFIG_ID_CHAIN";
export const LOAD_CONFIGS_PENDING = "LOAD_CONFIGS_PENDING";
export const LOAD_CONFIGS_FULFILLED = "LOAD_CONFIGS_FULFILLED";
export const LOAD_CONFIGS_FAILED = "LOAD_CONFIGS_FAILED";
export const SET_IS_SUBMITTING_CONFIG = "SET_IS_SUBMITTING_CONFIG";
export const SET_IS_SUBMITTING_CONFIG_UPLOAD = "SET_IS_SUBMITTING_CONFIG_UPLOAD";

// name, content
export type FilesUpload = Immutable.OrderedMap<string, string>;

export interface ConfigCreate {
  path: string;
  isDir: boolean;
  content: string;
}

export interface ConfigRes {
  name: string;
  path: string;
  isDir: boolean;
  content: string;
  children?: ConfigRes[];
}

export type ConfigNodeType = "file" | "folder";

export type ConfigNode = ImmutableMap<{
  id: string;
  name: string;
  type: ConfigNodeType;
  oldPath: string;
  content: string;
  children: Immutable.OrderedMap<string, ConfigNode>;
  ancestorIds: Immutable.List<string>;
}>;

export const initialRootConfigNode: ConfigNode = Immutable.fromJS({
  type: "folder",
  id: "/",
  name: "/",
  content: "",
  children: {},
  ancestorIds: []
});

export interface LoadConfigsPendingAction {
  type: typeof LOAD_CONFIGS_PENDING;
}

export interface LoadConfigsFailedAction {
  type: typeof LOAD_CONFIGS_FAILED;
}

export interface LoadConfigsFulfilledAction {
  type: typeof LOAD_CONFIGS_FULFILLED;
  payload: {
    configNode: ConfigNode;
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

export interface SetIsSubmittingConfig {
  type: typeof SET_IS_SUBMITTING_CONFIG;
  payload: {
    isSubmittingConfig: boolean;
  };
}

export type ConfigActions =
  | LoadConfigsFulfilledAction
  | LoadConfigsPendingAction
  | LoadConfigsFailedAction
  | CreateConfigAction
  | DeleteConfigAction
  | UpdateConfigAction
  | DuplicateConfigAction
  | UpdateCurrentConfigIdChain
  | SetIsSubmittingConfig;
