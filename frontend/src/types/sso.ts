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
  payload: ProtectedEndpoint[];
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

export interface ProtectedEndpoint {
  name: string;
  namespace: string;
  endpointName: string;
  ports?: number[];
  groups?: string[];
}

export const newEmptyProtectedEndpoint = (): ProtectedEndpoint => {
  return {
    name: "",
    namespace: "",
    endpointName: "",
    groups: [],
    ports: [],
  };
};

export interface LoadSSOConfigAction {
  type: typeof LOAD_SSO_CONFIG_FULFILLED;
  payload: SSOConfig | null;
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

export interface GitlabConfig {
  baseURL: string;
  clientID: string;
  clientSecret: string;
  groups: string[];
}

export interface GithubOrg {
  name: string;
  teams: string[];
}

export interface GithubConfig {
  clientID: string;
  clientSecret: string;
  orgs: GithubOrg[];
}

export interface SSOGithubConnector {
  id: string;
  name: string;
  type: typeof SSO_CONNECTOR_TYPE_GITHUB;
  config?: GithubConfig;
}

export interface SSOGitlabConnector {
  id: string;
  name: string;
  type: typeof SSO_CONNECTOR_TYPE_GITLAB;
  config: GitlabConfig;
}

export interface SSOConfig {
  domain: string;
  connectors?: Array<SSOGithubConnector | SSOGitlabConnector>;
  temporaryUser?: { [key: string]: any };
}

export const newEmptyGithubConnector = (): SSOGithubConnector => {
  return {
    id: ID(),
    name: "",
    type: SSO_CONNECTOR_TYPE_GITHUB,
    config: {
      clientID: "",
      clientSecret: "",
      orgs: [],
    },
  };
};

export const newEmptyGitlabConnector = (): SSOGitlabConnector => {
  return {
    id: ID(),
    name: "",
    type: SSO_CONNECTOR_TYPE_GITLAB,
    config: {
      baseURL: "https://gitlab.com",
      clientID: "",
      clientSecret: "",
      groups: [],
    },
  };
};

export const newEmptySSOConfig = (): SSOConfig => {
  return {
    domain: "",
    connectors: [],
  };
};
