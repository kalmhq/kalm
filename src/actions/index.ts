import { CallHistoryMethodAction } from "connected-react-router";

export const CREATE_COMPONENT_ACTION = "ACTION_CREATE_COMPONENT";

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

export type Actions = CreateComponentAction | CallHistoryMethodAction;
