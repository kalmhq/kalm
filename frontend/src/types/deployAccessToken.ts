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

export interface AccessTokenRule {
  namespace: string;
  name: string;
  verb: string;
  kind: string;
}

export interface AccessToken {
  name: string;
  memo: string;
  creator: string;
  token: string;
  rules: AccessTokenRule[];
}

export const DeployAccessTokenToAccessToken = (dat: DeployAccessToken): AccessToken => {
  const rules: AccessTokenRule[] = [];

  if (dat.get("scope") === DeployAccessTokenScopeCluster) {
    rules.push({
      name: "*",
      namespace: "*",
      verb: "edit",
      kind: "components",
    });
  } else if (dat.get("scope") === DeployAccessTokenScopeNamespace) {
    for (let i = 0; i < dat.get("resources").size; i++) {
      rules.push({
        name: "*",
        namespace: dat.get("resources").get(i)!,
        verb: "edit",
        kind: "components",
      });
    }
  } else {
    for (let i = 0; i < dat.get("resources").size; i++) {
      const [namespace, componentName] = dat.get("resources").get(i)!.split("/");
      rules.push({
        name: componentName,
        namespace: namespace,
        verb: "edit",
        kind: "components",
      });
    }
  }

  return {
    name: dat.get("name"),
    memo: dat.get("memo"),
    token: dat.get("token"),
    creator: dat.get("creator"),
    rules: rules,
  };
};

export const AccessTokenToDeployAccessToken = (at: AccessToken): DeployAccessToken => {
  const resources: string[] = [];
  let scope: DeployAccessTokenScope = "";

  if (at.rules.length === 1 && at.rules[0].namespace === "*" && at.rules[0].name === "*") {
    scope = DeployAccessTokenScopeCluster;
  } else if (at.rules.length > 0) {
    if (at.rules[0].name === "*") {
      scope = DeployAccessTokenScopeNamespace;
      for (let i = 0; i < at.rules.length; i++) {
        resources.push(at.rules[i].namespace);
      }
    } else {
      scope = DeployAccessTokenScopeComponent;
      for (let i = 0; i < at.rules.length; i++) {
        resources.push(`${at.rules[i].namespace}/${at.rules[i].name}`);
      }
    }
  }

  return Immutable.Map({
    name: at.name,
    memo: at.memo,
    token: at.token,
    creator: at.creator,
    resources: Immutable.List(resources),
    scope: scope,
  });
};

export type DeployAccessToken = ImmutableMap<{
  name: string;
  memo: string;
  scope: DeployAccessTokenScope;
  resources: Immutable.List<string>;
  token: string;
  creator: string;
}>;

export const newEmptyDeployAccessToken = () => {
  return Immutable.Map({
    memo: "",
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
