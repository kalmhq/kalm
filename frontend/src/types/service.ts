export const LOAD_SERVICES_FULFILLED = "LOAD_SERVICES_FULFILLED";
export const LOAD_SERVICES_PENDING = "LOAD_SERVICES_PENDING";
export const LOAD_SERVICES_FAILED = "LOAD_SERVICES_FAILED";

export interface Service {
  name: string;
  namespace: string;
  ports: {
    appProtocol: string;
    protocol: string;
    port: number;
    targetPort?: string | number;
    nodePort?: number;
  }[];
}

interface LoadServicesAction {
  type: typeof LOAD_SERVICES_FULFILLED;
  payload: {
    services: Service[];
  };
}

interface ServicesStateAction {
  type: typeof LOAD_SERVICES_PENDING | typeof LOAD_SERVICES_FAILED;
}

export type ServiceActions = ServicesStateAction | LoadServicesAction;
