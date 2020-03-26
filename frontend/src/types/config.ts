import Immutable from "immutable";
import { ImmutableMap } from "../typings";

export const CREATE_CONFIG = "CREATE_CONFIG";
export const DUPLICATE_CONFIG = "DUPLICATE_CONFIG";
export const UPDATE_CONFIG = "UPDATE_CONFIG";
export const DELETE_CONFIG = "DELETE_CONFIG";
export const SET_CURRENT_CONFIG_ID_CHAIN = "SET_CURRENT_CONFIG_ID_CHAIN";
export const LOAD_CONFIGS_PENDING = "LOAD_CONFIGS_PENDING";
export const LOAD_CONFIGS_FULFILLED = "LOAD_CONFIGS_FULFILLED";

export type ConfigFile = ImmutableMap<{
  id: string;
  name: string;
  path: string;
  content: string;
  resourceVersion?: string;
}>;

export type ConfigNode = ImmutableMap<{
  type: "folder" | "file";
  id: string; // for folder is display name, for file is metadata name
  name: string; // display name
  content: string;
  children: Immutable.OrderedMap<string, ConfigNode>;
  ancestorIds: Immutable.List<string>;
  resourceVersion?: string;
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

export type ConfigActions =
  | LoadConfigsFulfilledAction
  | LoadConfigsPendingAction
  | CreateConfigAction
  | DeleteConfigAction
  | UpdateConfigAction
  | DuplicateConfigAction
  | UpdateCurrentConfigIdChain;
