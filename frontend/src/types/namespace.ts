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

export interface LoadNamespacesAction {
  type: typeof LOAD_NAMESPACES;
  payload: {
    namespaces: Namespaces;
  };
}

export interface CreateNamespacePendingAction {
  type: typeof CREATE_NAMESPACE_PENDING;
}

export interface CreateNamespaceFulfilledAction {
  type: typeof CREATE_NAMESPACE_FULFILLED;
}

export type NamespaceActions = LoadNamespacesAction | CreateNamespacePendingAction | CreateNamespaceFulfilledAction;
