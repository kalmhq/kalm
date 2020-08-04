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

export const DELETE_SSO_CONFIG_FULFILLED = "DELETE_SSO_CONFIG_FULFILLED";
export const DELETE_SSO_CONFIG_PENDING = "DELETE_SSO_CONFIG_PENDING";
export const DELETE_SSO_CONFIG_FAILED = "DELETE_SSO_CONFIG_FAILED";

export const LOAD_PROTECTED_ENDPOINTS_FULFILLED = "LOAD_PROTECTED_ENDPOINTS_FULFILLED";
export const LOAD_PROTECTED_ENDPOINTS_PENDING = "LOAD_PROTECTED_ENDPOINTS_PENDING";
export const LOAD_PROTECTED_ENDPOINTS_FAILED = "LOAD_PROTECTED_ENDPOINTS_FAILED";

export const CREATE_PROTECTED_ENDPOINT_FULFILLED = "CREATE_PROTECTED_ENDPOINT_FULFILLED";
export const CREATE_PROTECTED_ENDPOINT_PENDING = "CREATE_PROTECTED_ENDPOINT_PENDING";
export const CREATE_PROTECTED_ENDPOINT_FAILED = "CREATE_PROTECTED_ENDPOINT_FAILED";

export const UPDATE_PROTECTED_ENDPOINT_FULFILLED = "UPDATE_PROTECTED_ENDPOINT_FULFILLED";
export const UPDATE_PROTECTED_ENDPOINT_PENDING = "UPDATE_PROTECTED_ENDPOINT_PENDING";
export const UPDATE_PROTECTED_ENDPOINT_FAILED = "UPDATE_PROTECTED_ENDPOINT_FAILED";

export const DELETE_PROTECTED_ENDPOINT_FULFILLED = "DELETE_PROTECTED_ENDPOINT_FULFILLED";
export const DELETE_PROTECTED_ENDPOINT_PENDING = "DELETE_PROTECTED_ENDPOINT_PENDING";
export const DELETE_PROTECTED_ENDPOINT_FAILED = "DELETE_PROTECTED_ENDPOINT_FAILED";

export interface LoadProtectedEndpointsAction {
  type: typeof LOAD_PROTECTED_ENDPOINTS_FULFILLED;
  payload: Immutable.List<ProtectedEndpoint>;
}

export interface DeleteProtectedEndpointAction {
  type: typeof DELETE_PROTECTED_ENDPOINT_FULFILLED;
}

export interface CreateProtectedEndpointAction {
  type: typeof CREATE_PROTECTED_ENDPOINT_FULFILLED;
  payload: ProtectedEndpoint;
}

export interface UpdateProtectedEndpointAction {
  type: typeof UPDATE_PROTECTED_ENDPOINT_FULFILLED;
  payload: ProtectedEndpoint;
}

export type ProtectedEndpoint = ImmutableMap<{
  name: string;
  namespace: string;
  endpointName: string;
  ports?: Immutable.List<number>;
  groups?: Immutable.List<string>;
}>;

export const newEmptyProtectedEndpoint = (): ProtectedEndpoint => {
  return Immutable.Map({
    name: "",
    namespace: "",
    endpointName: "",
    groups: Immutable.List(),
    ports: Immutable.List(),
  });
};

export interface LoadSSOConfigAction {
  type: typeof LOAD_SSO_CONFIG_FULFILLED;
  payload: SSOConfig;
}

export interface DeleteSSOConfigAction {
  type: typeof DELETE_SSO_CONFIG_FULFILLED;
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
    | typeof DELETE_SSO_CONFIG_PENDING
    | typeof DELETE_SSO_CONFIG_FAILED
    | typeof LOAD_PROTECTED_ENDPOINTS_PENDING
    | typeof LOAD_PROTECTED_ENDPOINTS_FAILED
    | typeof CREATE_PROTECTED_ENDPOINT_PENDING
    | typeof CREATE_PROTECTED_ENDPOINT_FAILED
    | typeof UPDATE_PROTECTED_ENDPOINT_PENDING
    | typeof UPDATE_PROTECTED_ENDPOINT_FAILED
    | typeof DELETE_PROTECTED_ENDPOINT_PENDING
    | typeof DELETE_PROTECTED_ENDPOINT_FAILED;
}

export type SSOConfigActions =
  | LoadSSOConfigAction
  | SSOConfigsStateAction
  | DeleteSSOConfigAction
  | CreateSSOConfigAction
  | UpdateSSOConfigAction
  | LoadProtectedEndpointsAction
  | CreateProtectedEndpointAction
  | UpdateProtectedEndpointAction
  | DeleteProtectedEndpointAction;

export type SSO_CONNECTOR_TYPE = string;

export const SSO_CONNECTOR_TYPE_GITHUB: SSO_CONNECTOR_TYPE = "github";
export const SSO_CONNECTOR_TYPE_GITLAB: SSO_CONNECTOR_TYPE = "gitlab";

export type GitlabConfig = ImmutableMap<{
  baseURL: string;
  clientID: string;
  clientSecret: string;
  groups: Immutable.List<string>;
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
