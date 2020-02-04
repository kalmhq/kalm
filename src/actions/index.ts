import { CallHistoryMethodAction } from "connected-react-router";

export const CREATE_COMPONENT_ACTION = "ACTION_CREATE_COMPONENT";
export const UPDATE_COMPONENT_ACTION = "UPDATE_COMPONENT_ACTION";
export const DELETE_COMPONENT_ACTION = "DELETE_COMPONENT_ACTION";

export interface ComponentFormValues {
  id: string;
  name: string;
  image: string;
  command: string;
  env: {
    name: string;
    type: string;
    value: string;
  }[];
  ports: {
    name: string;
    protocol: string;
    containerPort: number;
    servicePort: number;
  }[];
  cpu: number;
  memory: number;
  disk: {
    name: string;
    type: string;
    path: string;
    existDisk: string;
    size: string;
    storageClass: string;
  }[];
}

export interface CreateComponentAction {
  type: typeof CREATE_COMPONENT_ACTION;
  payload: {
    componentValues: ComponentFormValues;
  };
}

export interface UpdateComponentAction {
  type: typeof UPDATE_COMPONENT_ACTION;
  payload: {
    componentId: string;
    componentValues: ComponentFormValues;
  };
}

export interface DeleteComponentAction {
  type: typeof DELETE_COMPONENT_ACTION;
  payload: {
    componentId: string;
  };
}

export type Actions =
  | CreateComponentAction
  | DeleteComponentAction
  | UpdateComponentAction
  | CallHistoryMethodAction;
