import { Node } from "types/node";
import { ApplicationComponentDetails, ApplicationDetails } from "./application";
import { HttpRoute } from "./route";
import { Certificate } from "./certificate";
import { RegistryType } from "./registry";
import { Disk } from "./disk";
import { ProtectedEndpoint, SSOConfig } from "types/sso";

export const WATCHED_RESOURCE_CHANGE = "WATCHED_RESOURCE_CHANGE";

export const RESOURCE_ACTION_UPDATE = "Update";
export const RESOURCE_ACTION_ADD = "Add";
export const RESOURCE_ACTION_DELETE = "Delete";

export const RESOURCE_TYPE_NODE = "Node";
export const RESOURCE_TYPE_APPLICATION = "Application";
export const RESOURCE_TYPE_COMPONENT = "Component";
export const RESOURCE_TYPE_HTTP_ROUTE = "HttpRoute";
export const RESOURCE_TYPE_HTTPS_CERT = "HttpsCert";
export const RESOURCE_TYPE_REGISTRY = "Registry";
export const RESOURCE_TYPE_VOLUME = "Volume";
export const RESOURCE_TYPE_SSO = "SingleSignOnConfig";
export const RESOURCE_TYPE_PROTECTED_ENDPOINT = "ProtectedEndpoint";

export type ResourceActionType =
  | typeof RESOURCE_ACTION_UPDATE
  | typeof RESOURCE_ACTION_ADD
  | typeof RESOURCE_ACTION_DELETE;

export interface NodeResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_NODE;
  payload: {
    action: ResourceActionType;
    data: Node;
  };
}

export interface ApplicationResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_APPLICATION;
  payload: {
    action: ResourceActionType;
    data: ApplicationDetails;
  };
}

export interface ComponentResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_COMPONENT;
  payload: {
    action: ResourceActionType;
    namespace: string;
    data: ApplicationComponentDetails;
  };
}

export interface HttpRouteResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_HTTP_ROUTE;
  payload: {
    action: ResourceActionType;
    namespace: string;
    data: HttpRoute;
  };
}

export interface HttpsCertResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_HTTPS_CERT;
  payload: {
    action: ResourceActionType;
    data: Certificate;
  };
}

export interface RegistryResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_REGISTRY;
  payload: {
    action: ResourceActionType;
    data: RegistryType;
  };
}

export interface VolumeResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_VOLUME;
  payload: {
    action: ResourceActionType;
    data: Disk;
  };
}

export interface SSOConfigResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_SSO;
  payload: {
    action: ResourceActionType;
    data: SSOConfig;
  };
}

export interface ProtectedEndpointResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_PROTECTED_ENDPOINT;
  payload: {
    action: ResourceActionType;
    data: ProtectedEndpoint;
  };
}

export type ResourceActions =
  | NodeResourceAction
  | ApplicationResourceAction
  | ComponentResourceAction
  | HttpRouteResourceAction
  | HttpsCertResourceAction
  | RegistryResourceAction
  | VolumeResourceAction
  | SSOConfigResourceAction
  | ProtectedEndpointResourceAction;
