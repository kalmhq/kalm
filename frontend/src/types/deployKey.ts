export const CREATE_DEPLOY_KEY_FAILED = "CREATE_DEPLOY_KEY_FAILED";
export const CREATE_DEPLOY_KEY_FULFILLED = "CREATE_DEPLOY_KEY_FULFILLED";
export const CREATE_DEPLOY_KEY_PENDING = "CREATE_DEPLOY_KEY_PENDING";
export const DELETE_DEPLOY_KEY_FAILED = "DELETE_DEPLOY_KEY_FAILED";
export const DELETE_DEPLOY_KEY_FULFILLED = "DELETE_DEPLOY_KEY_FULFILLED";
export const DELETE_DEPLOY_KEY_PENDING = "DELETE_DEPLOY_KEY_PENDING";
export const LOAD_DEPLOY_KEYS_FAILED = "LOAD_DEPLOY_KEYS_FAILED";
export const LOAD_DEPLOY_KEYS_FULFILLED = "LOAD_DEPLOY_KEYS_FULFILLED";
export const LOAD_DEPLOY_KEYS_PENDING = "LOAD_DEPLOY_KEYS_PENDING";

export type WebhookScope = string;

export const WebhookScopeCluster: WebhookScope = "cluster";
export const WebhookScopeNamespace: WebhookScope = "namespace";
export const WebhookScopeComponent: WebhookScope = "component";

export interface Webhook {
  name: string;
  scope: WebhookScope;
  resources: string[];
  key: string;
  creator: string;
}

export const newEmptyWebhookForm: Webhook = {
  name: "",
  scope: WebhookScopeCluster,
  resources: [],
  key: "",
  creator: "",
};

export interface LoadWebhooksAction {
  type: typeof LOAD_DEPLOY_KEYS_FULFILLED;
  payload: Webhook[];
}

export interface DeleteWebhookAction {
  type: typeof DELETE_DEPLOY_KEY_FULFILLED;
}

export interface CreateWebhookAction {
  type: typeof CREATE_DEPLOY_KEY_FULFILLED;
  payload: Webhook;
}

export interface WebhookStateAction {
  type:
    | typeof CREATE_DEPLOY_KEY_FAILED
    | typeof CREATE_DEPLOY_KEY_PENDING
    | typeof DELETE_DEPLOY_KEY_FAILED
    | typeof DELETE_DEPLOY_KEY_PENDING
    | typeof LOAD_DEPLOY_KEYS_FAILED
    | typeof LOAD_DEPLOY_KEYS_PENDING;
}

export type WebhookActions = WebhookStateAction | LoadWebhooksAction | DeleteWebhookAction | CreateWebhookAction;
