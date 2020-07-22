import { ImmutableMap } from "typings";
import Immutable from "immutable";
import { ID } from "utils";

export const LOAD_SSO_CONFIG_FULFILLED = "LOAD_SSO_CONFIG_FULFILLED";
export const LOAD_SSO_CONFIG_PENDING = "LOAD_SSO_CONFIG_PENDING";
export const LOAD_SSO_CONFIG_FAILED = "LOAD_SSO_CONFIG_FAILED";

export const CREATE_SSO_CONFIG_FULFILLED = "CREATE_SSO_CONFIG_FULFILLED";
export const CREATE_SSO_CONFIG_PENDING = "CREATE_SSO_CONFIG_PENDING";
export const CREATE_SSO_CONFIG_FAILED = "CREATE_SSO_CONFIG_FAILED";

export const UPDATE_SSO_CONFIG_FULFILLED = "UPDATE_SSO_CONFIG_FULFILLED";
export const UPDATE_SSO_CONFIG_PENDING = "UPDATE_SSO_CONFIG_PENDING";
export const UPDATE_SSO_CONFIG_FAILED = "UPDATE_SSO_CONFIG_FAILED";

export const DELETE_SSO_CONFIG_PENDING = "DELETE_SSO_CONFIG_PENDING";
export const DELETE_SSO_CONFIG_FULFILLED = "DELETE_SSO_CONFIG_FULFILLED";
export const DELETE_SSO_CONFIG_FAILED = "DELETE_SSO_CONFIG_FAILED";

export interface LoadSSOConfigAction {
  type: typeof LOAD_SSO_CONFIG_FULFILLED;
  payload: SSOConfig;
}

export interface DeleteSSOConfigAction {
  type: typeof DELETE_SSO_CONFIG_PENDING;
}

export interface CreateSSOConfigAction {
  type: typeof CREATE_SSO_CONFIG_FULFILLED;
  payload: SSOConfig;
}

export interface UpdateSSOConfigAction {
  type: typeof UPDATE_SSO_CONFIG_FULFILLED;
  payload: SSOConfig;
}

export interface SSOConfigsStateAction {
  type:
    | typeof LOAD_SSO_CONFIG_PENDING
    | typeof LOAD_SSO_CONFIG_FAILED
    | typeof CREATE_SSO_CONFIG_PENDING
    | typeof CREATE_SSO_CONFIG_FAILED
    | typeof UPDATE_SSO_CONFIG_PENDING
    | typeof UPDATE_SSO_CONFIG_FAILED
    | typeof DELETE_SSO_CONFIG_FULFILLED
    | typeof DELETE_SSO_CONFIG_FAILED;
}

export type SSOConfigActions =
  | LoadSSOConfigAction
  | SSOConfigsStateAction
  | DeleteSSOConfigAction
  | CreateSSOConfigAction
  | UpdateSSOConfigAction;

export type SSO_CONNECTOR_TYPE = string;

export const SSO_CONNECTOR_TYPE_GITHUB: SSO_CONNECTOR_TYPE = "github";
export const SSO_CONNECTOR_TYPE_GITLAB: SSO_CONNECTOR_TYPE = "gitlab";

export type GitlabConfig = ImmutableMap<{
  clientID: string;
  clientSecret: string;
  orgs: Immutable.List<string>;
}>;

export type GithubOrg = ImmutableMap<{
  name: string;
  teams: Immutable.List<string>;
}>;

export type GithubConfig = ImmutableMap<{
  clientID: string;
  clientSecret: string;
  orgs: Immutable.List<GithubOrg>;
}>;

export type SSOGithubConnector = ImmutableMap<{
  id: string;
  name: string;
  type: typeof SSO_CONNECTOR_TYPE_GITHUB;
  config: GithubConfig;
}>;

export type SSOGitlabConnector = ImmutableMap<{
  id: string;
  name: string;
  type: typeof SSO_CONNECTOR_TYPE_GITLAB;
  config: GitlabConfig;
}>;

export type SSOConfig = ImmutableMap<{
  domain: string;
  connectors: Immutable.List<SSOGithubConnector | SSOGitlabConnector>;
}>;

export const newEmptyGithubConnector = (): SSOGithubConnector => {
  return Immutable.Map({
    id: ID(),
    name: "",
    type: SSO_CONNECTOR_TYPE_GITHUB,
    config: Immutable.Map({
      clientID: "",
      clientSecret: "",
      orgs: Immutable.List([]),
    }),
  });
};

export const newEmptyGitlabConnector = (): SSOGitlabConnector => {
  return Immutable.Map({
    id: ID(),
    name: "",
    type: SSO_CONNECTOR_TYPE_GITLAB,
    config: Immutable.Map({
      baseURL: "https://gitlab.com",
      clientID: "",
      clientSecret: "",
      groups: Immutable.List([]),
    }),
  });
};

export const newEmptySSOConfig = (): SSOConfig => {
  return Immutable.Map({
    domain: "",
    connectors: Immutable.List(),
  });
};
