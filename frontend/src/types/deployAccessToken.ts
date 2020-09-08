import { ImmutableMap } from "typings";
import Immutable from "immutable";

export const CREATE_DEPLOY_ACCESS_TOKEN_FAILED = "CREATE_DEPLOY_ACCESS_TOKEN_FAILED";
export const CREATE_DEPLOY_ACCESS_TOKEN_FULFILLED = "CREATE_DEPLOY_ACCESS_TOKEN_FULFILLED";
export const CREATE_DEPLOY_ACCESS_TOKEN_PENDING = "CREATE_DEPLOY_ACCESS_TOKEN_PENDING";
export const DELETE_DEPLOY_ACCESS_TOKEN_FAILED = "DELETE_DEPLOY_ACCESS_TOKEN_FAILED";
export const DELETE_DEPLOY_ACCESS_TOKEN_FULFILLED = "DELETE_DEPLOY_ACCESS_TOKEN_FULFILLED";
export const DELETE_DEPLOY_ACCESS_TOKEN_PENDING = "DELETE_DEPLOY_ACCESS_TOKEN_PENDING";
export const LOAD_DEPLOY_ACCESS_TOKENS_FAILED = "LOAD_DEPLOY_ACCESS_TOKENS_FAILED";
export const LOAD_DEPLOY_ACCESS_TOKENS_FULFILLED = "LOAD_DEPLOY_ACCESS_TOKENS_FULFILLED";
export const LOAD_DEPLOY_ACCESS_TOKENS_PENDING = "LOAD_DEPLOY_ACCESS_TOKENS_PENDING";

export type DeployAccessTokenScope = string;

export const DeployAccessTokenScopeCluster: DeployAccessTokenScope = "cluster";
export const DeployAccessTokenScopeNamespace: DeployAccessTokenScope = "namespace";
export const DeployAccessTokenScopeComponent: DeployAccessTokenScope = "component";

export type DeployAccessToken = ImmutableMap<{
  name: string;
  scope: DeployAccessTokenScope;
  resources: Immutable.List<string>;
  key: string;
  creator: string;
}>;

export const newEmptyDeployAccessToken = () => {
  return Immutable.Map({
    name: "",
    scope: DeployAccessTokenScopeCluster,
    resources: Immutable.List(),
    creator: "",
  });
};

export interface LoadDeployAccessTokensAction {
  type: typeof LOAD_DEPLOY_ACCESS_TOKENS_FULFILLED;
  payload: Immutable.List<DeployAccessToken>;
}

export interface DeleteDeployAccessTokenAction {
  type: typeof DELETE_DEPLOY_ACCESS_TOKEN_FULFILLED;
}

export interface CreateDeployAccessTokenAction {
  type: typeof CREATE_DEPLOY_ACCESS_TOKEN_FULFILLED;
  payload: DeployAccessToken;
}

export interface DeployAccessTokenStateAction {
  type:
    | typeof CREATE_DEPLOY_ACCESS_TOKEN_FAILED
    | typeof CREATE_DEPLOY_ACCESS_TOKEN_PENDING
    | typeof DELETE_DEPLOY_ACCESS_TOKEN_FAILED
    | typeof DELETE_DEPLOY_ACCESS_TOKEN_PENDING
    | typeof LOAD_DEPLOY_ACCESS_TOKENS_FAILED
    | typeof LOAD_DEPLOY_ACCESS_TOKENS_PENDING;
}

export type DeployAccessTokenActions =
  | DeployAccessTokenStateAction
  | LoadDeployAccessTokensAction
  | DeleteDeployAccessTokenAction
  | CreateDeployAccessTokenAction;
