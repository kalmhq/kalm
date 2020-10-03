export const CREATE_DEPLOY_KEY_FAILED = "CREATE_DEPLOY_KEY_FAILED";
export const CREATE_DEPLOY_KEY_FULFILLED = "CREATE_DEPLOY_KEY_FULFILLED";
export const CREATE_DEPLOY_KEY_PENDING = "CREATE_DEPLOY_KEY_PENDING";
export const DELETE_DEPLOY_KEY_FAILED = "DELETE_DEPLOY_KEY_FAILED";
export const DELETE_DEPLOY_KEY_FULFILLED = "DELETE_DEPLOY_KEY_FULFILLED";
export const DELETE_DEPLOY_KEY_PENDING = "DELETE_DEPLOY_KEY_PENDING";
export const LOAD_DEPLOY_KEYS_FAILED = "LOAD_DEPLOY_KEYS_FAILED";
export const LOAD_DEPLOY_KEYS_FULFILLED = "LOAD_DEPLOY_KEYS_FULFILLED";
export const LOAD_DEPLOY_KEYS_PENDING = "LOAD_DEPLOY_KEYS_PENDING";

export type DeployKeyScope = string;

export const DeployKeyScopeCluster: DeployKeyScope = "cluster";
export const DeployKeyScopeNamespace: DeployKeyScope = "namespace";
export const DeployKeyScopeComponent: DeployKeyScope = "component";

export interface DeployKey {
  name: string;
  scope: DeployKeyScope;
  resources: string[];
  key: string;
  creator: string;
}

export const newEmptyDeployKeyForm: DeployKey = {
  name: "",
  scope: DeployKeyScopeCluster,
  resources: [],
  key: "",
  creator: "",
};

export interface LoadDeployKeysAction {
  type: typeof LOAD_DEPLOY_KEYS_FULFILLED;
  payload: DeployKey[];
}

export interface DeleteDeployKeyAction {
  type: typeof DELETE_DEPLOY_KEY_FULFILLED;
}

export interface CreateDeployKeyAction {
  type: typeof CREATE_DEPLOY_KEY_FULFILLED;
  payload: DeployKey;
}

export interface DeployKeyStateAction {
  type:
    | typeof CREATE_DEPLOY_KEY_FAILED
    | typeof CREATE_DEPLOY_KEY_PENDING
    | typeof DELETE_DEPLOY_KEY_FAILED
    | typeof DELETE_DEPLOY_KEY_PENDING
    | typeof LOAD_DEPLOY_KEYS_FAILED
    | typeof LOAD_DEPLOY_KEYS_PENDING;
}

export type DeployKeyActions =
  | DeployKeyStateAction
  | LoadDeployKeysAction
  | DeleteDeployKeyAction
  | CreateDeployKeyAction;
