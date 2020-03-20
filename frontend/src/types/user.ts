import Immutable from "immutable";
import { ImmutableMap } from "../typings";

export const LOAD_USERS_PENDING = "LOAD_USERS_PENDING";
export const LOAD_USERS_FULFILLED = "LOAD_USERS_FULFILLED";

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

export interface LoadUsersPendingAction {
  type: typeof LOAD_USERS_PENDING;
}

export interface LoadUsersFulfilledAction {
  type: typeof LOAD_USERS_FULFILLED;
  payload: {
    users: Immutable.OrderedMap<string, User>;
  };
}

export type UserActions = LoadUsersPendingAction | LoadUsersFulfilledAction;
