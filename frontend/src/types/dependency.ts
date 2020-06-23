import { ImmutableMap } from "../typings";

export const LOAD_DEPENDENCIES_PENDING = "LOAD_DEPENDENCIES_PENDING";
export const LOAD_DEPENDENCIES_FULFILLED = "LOAD_DEPENDENCIES_FULFILLED";
export const LOAD_DEPENDENCIES_FAILED = "LOAD_DEPENDENCIES_FAILED";

export enum KappDependencyStatus {
  NotInstalled,
  InstallFailed,
  Installing,
  Uninstalling,
  Running,
}

export const KappDependencyStatusText = ["Not Installed", "Install Failed", "Installing", "Uninstalling", "Running"];

export interface KappDependencyContent {
  name: string;
  type: string;
  version: string;
  imageLink: string;
  description: string;
  provider: string;
  status: KappDependencyStatus;
  statusText?: string;
  projectHomepageLink: string;
}

export type KappDependency = ImmutableMap<KappDependencyContent>;

export interface LoadDependenciesPendingAction {
  type: typeof LOAD_DEPENDENCIES_PENDING;
}

export interface LoadDependenciesFailedAction {
  type: typeof LOAD_DEPENDENCIES_FAILED;
}

export interface LoadDependenciesFulfilledAction {
  type: typeof LOAD_DEPENDENCIES_FULFILLED;
  payload: {
    dependencies: Array<KappDependency>;
  };
}

export type DependencyActions =
  | LoadDependenciesPendingAction
  | LoadDependenciesFailedAction
  | LoadDependenciesFulfilledAction;
