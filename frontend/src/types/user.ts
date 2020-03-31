import Immutable from "immutable";
import { ImmutableMap } from "../typings";

export const LOAD_USERS_PENDING = "LOAD_USERS_PENDING";
export const LOAD_USERS_FULFILLED = "LOAD_USERS_FULFILLED";
export const LOAD_USERS_FAILED = "LOAD_USERS_FAILED";
export const CREATE_USER = "CREATE_USER";
export const DELETE_USER = "DELETE_USER";

export const allClusterRoleNames = [
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

export type UserType = "serviceAccount" | "oidc";

export interface UserInterface {
  name: string;
  type: UserType;
  serviceAccountName?: string;
  secretName?: string;
  token?: string;
  // key: clusterRoleName
  clusterRoleNames: Immutable.OrderedMap<string, boolean>;
  // key: clusterRoleName, value: clusterRoleBindingName
  clusterRoleBindingNames: Immutable.OrderedMap<string, string>;
}

export type User = ImmutableMap<UserInterface>;
export type Users = Immutable.OrderedMap<string, User>;

export interface LoadUsersPendingAction {
  type: typeof LOAD_USERS_PENDING;
}

export interface LoadUsersFailedAction {
  type: typeof LOAD_USERS_FAILED;
}

export interface LoadUsersFulfilledAction {
  type: typeof LOAD_USERS_FULFILLED;
  payload: {
    users: Users;
  };
}

export interface CreateUserAction {
  type: typeof CREATE_USER;
  payload: {
    user: User;
  };
}

export interface DeleteUserAction {
  type: typeof DELETE_USER;
  payload: {
    user: User;
  };
}

export type UserActions =
  | LoadUsersPendingAction
  | LoadUsersFailedAction
  | LoadUsersFulfilledAction
  | CreateUserAction
  | DeleteUserAction;
