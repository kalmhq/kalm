import Immutable from "immutable";
import { ImmutableMap } from "../typings";

// Models

export type Namespace = ImmutableMap<{
  name: string;
}>;

export type Namespaces = Immutable.List<Namespace>;

// Actions
export const LOAD_NAMESPACES = "LOAD_NAMESPACES";
export const CREATE_NAMESPACE_PENDING = "CREATE_NAMESPACE_PENDING";
export const CREATE_NAMESPACE_FULFILLED = "CREATE_NAMESPACE_FULFILLED";

export const LOAD_NAMESPACES_PENDING = "LOAD_NAMESPACES_PENDING";
export const LOAD_NAMESPACES_FULFILLED = "LOAD_NAMESPACES_FULFILLED";
export const LOAD_NAMESPACES_FAILED = "LOAD_NAMESPACES_FAILED";
export const SET_CURRENT_NAMESPACE = "SET_CURRENT_NAMESPACE";

export interface LoadNamespacesAction {
  type: typeof LOAD_NAMESPACES_FULFILLED;
  payload: {
    namespaces: Namespaces;
  };
}

export interface NamespaceStateAction {
  type:
    | typeof CREATE_NAMESPACE_PENDING
    | typeof CREATE_NAMESPACE_FULFILLED
    | typeof LOAD_NAMESPACES_PENDING
    | typeof LOAD_NAMESPACES_FAILED;
}

export interface SetCurrentNamespace {
  type: typeof SET_CURRENT_NAMESPACE;
  payload: {
    namespace: string;
  };
}

export type NamespaceActions = LoadNamespacesAction | NamespaceStateAction | SetCurrentNamespace;
