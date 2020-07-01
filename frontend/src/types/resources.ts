import { Node } from "types/node";

export const WATCHED_RESOURCE_CHANGE = "WATCHED_RESOURCE_CHANGE";

export const RESOURCE_ACTION_UPDATE = "Update";
export const RESOURCE_ACTION_ADD = "Add";
export const RESOURCE_ACTION_DELETE = "Delete";

export const RESOURCE_TYPE_NODE = "Node";

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

export type ResourceActions = NodeResourceAction;
