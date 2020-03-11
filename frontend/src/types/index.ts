import { ThunkDispatch } from "redux-thunk";
import { RootState } from "../reducers";
import { Actions } from "../actions";
import { ImmutableMap } from "../typings";

export type DispatchType = ThunkDispatch<RootState, undefined, Actions>;

export enum KappDependencyStatus {
  NotInstalled,
  InstallFailed,
  Installing,
  Uninstalling,
  Running
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
