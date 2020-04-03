// import Immutable from "immutable";
// import { ImmutableMap } from "../typings";

export const LOAD_NAMESPACES_PENDING = "LOAD_NAMESPACES_PENDING";
export const LOAD_NAMESPACES_FULFILLED = "LOAD_NAMESPACES_FULFILLED";
export const LOAD_NAMESPACES_FAILED = "LOAD_NAMESPACES_FAILED";
export const SET_CURRENT_NAMESPACE = "SET_CURRENT_NAMESPACE";

export interface LoadNamespacesPendingAction {
  type: typeof LOAD_NAMESPACES_PENDING;
}

export interface LoadNamespacesFailedAction {
  type: typeof LOAD_NAMESPACES_FAILED;
}

export interface LoadNamespacesFulfilledAction {
  type: typeof LOAD_NAMESPACES_FULFILLED;
  payload: {
    namespaces: string[];
  };
}

export interface SetCurrentNamespace {
  type: typeof SET_CURRENT_NAMESPACE;
  payload: {
    namespace: string;
  };
}

export type NamespaceActions =
  | LoadNamespacesFulfilledAction
  | LoadNamespacesPendingAction
  | LoadNamespacesFailedAction
  | SetCurrentNamespace;
