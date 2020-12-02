import { DeployAccessToken } from "types/deployAccessToken";
import { Domain } from "types/domains";
import { RoleBinding } from "types/member";
import { Node } from "types/node";
import { Service } from "types/service";
import { ProtectedEndpoint, SSOConfig } from "types/sso";
import { ApplicationComponentDetails, ApplicationDetails } from "./application";
import { AcmeServerInfo, Certificate } from "./certificate";
import { Disk } from "./disk";
import { Registry } from "./registry";
import { HttpRoute } from "./route";

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
export const RESOURCE_TYPE_DEPLOY_ACCESS_TOKEN = "DeployAccessToken";
export const RESOURCE_TYPE_SERVICE = "Service";
export const RESOURCE_TYPE_ROLE_BINDING = "RoleBinding";
export const RESOURCE_TYPE_ACME_SERVER = "ACMEServer";
export const RESOURCE_TYPE_DOMAIN = "Domain";

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
    data: Registry;
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

export interface DeployAccessTokenResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_DEPLOY_ACCESS_TOKEN;
  payload: {
    action: ResourceActionType;
    data: DeployAccessToken;
  };
}

export interface ServiceResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_SERVICE;
  payload: {
    action: ResourceActionType;
    data: Service;
  };
}

export interface RoleBindingResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_ROLE_BINDING;
  payload: {
    action: ResourceActionType;
    data: RoleBinding;
  };
}

export interface ACMEServerResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_ACME_SERVER;
  payload: {
    action: ResourceActionType;
    data: AcmeServerInfo;
  };
}

export interface DomainResourceAction {
  type: typeof WATCHED_RESOURCE_CHANGE;
  kind: typeof RESOURCE_TYPE_DOMAIN;
  payload: {
    action: ResourceActionType;
    data: Domain;
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
  | ProtectedEndpointResourceAction
  | DeployAccessTokenResourceAction
  | ServiceResourceAction
  | RoleBindingResourceAction
  | DomainResourceAction
  | ACMEServerResourceAction;
