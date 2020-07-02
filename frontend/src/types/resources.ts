import { Node } from "types/node";
import { ApplicationDetails, ApplicationComponentDetails } from "./application";
import { HttpRoute } from "./route";

export const WATCHED_RESOURCE_CHANGE = "WATCHED_RESOURCE_CHANGE";

export const RESOURCE_ACTION_UPDATE = "Update";
export const RESOURCE_ACTION_ADD = "Add";
export const RESOURCE_ACTION_DELETE = "Delete";

export const RESOURCE_TYPE_NODE = "Node";
export const RESOURCE_TYPE_APPLICATION = "Application";
export const RESOURCE_TYPE_COMPONENT = "Component";
export const RESOURCE_TYPE_HTTP_ROUTE = "HttpRoute";

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

export type ResourceActions =
  | NodeResourceAction
  | ApplicationResourceAction
  | ComponentResourceAction
  | HttpRouteResourceAction;
