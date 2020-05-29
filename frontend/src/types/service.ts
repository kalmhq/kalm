import { ImmutableMap } from "typings";
import Immutable from "immutable";

export const LOAD_SERVICES_FULFILLED = "LOAD_SERVICES_FULFILLED";
export const LOAD_SERVICES_PENDING = "LOAD_SERVICES_PENDING";
export const LOAD_SERVICES_FAILED = "LOAD_SERVICES_FAILED";

export interface ServiceContent {
  name: string;
  namespace: string;
}

export type Service = ImmutableMap<ServiceContent>;

export interface LoadServicesAction {
  type: typeof LOAD_SERVICES_FULFILLED;
  payload: {
    services: Immutable.List<Service>;
  };
}

export interface ServicesStateAction {
  type: typeof LOAD_SERVICES_PENDING | typeof LOAD_SERVICES_FAILED;
}

export type ServiceActions = ServicesStateAction | LoadServicesAction;
