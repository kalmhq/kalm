import Immutable from "immutable";
import { ImmutableMap } from "typings";

export const LOAD_ROUTES_FULLFILLED = "LOAD_ROUTES_FULLFILLED";
export const LOAD_ROUTES_PENDING = "LOAD_ROUTES_PENDING";
export const LOAD_ROUTES_FAILED = "LOAD_ROUTES_FAILED";

export type HttpRouteCondition = ImmutableMap<{
  type: string;
  key: string;
  operator: string;
  value: string;
}>;

export type HttpRouteDestination = ImmutableMap<{
  host: string;
  weight: number;
}>;

export type HttpRouteRetry = ImmutableMap<{
  attempts: number;
  perTtyTimeoutSeconds: number;
  retryOn: Immutable.List<string>;
}>;

export type HttpRouteMirror = ImmutableMap<{
  destination: HttpRouteDestination;
  percentage: number;
}>;

export type HttpRouteFault = ImmutableMap<{
  percentage: number;
  errorStatus: number;
}>;

export type HttpRouteDelay = ImmutableMap<{
  percentage: number;
  delaySeconds: number;
}>;

export type HttpRouteCORS = ImmutableMap<{
  allowOrigin: Immutable.List<string>;
  allowMethods: Immutable.List<string>;
  allowCredentials: boolean;
  allowHeaders: Immutable.List<string>;
  maxAge: string;
}>;

export type HttpRoute = ImmutableMap<{
  hosts: Immutable.List<string>;
  urls: Immutable.List<string>;
  conditions: Immutable.List<HttpRouteCondition>;
  destinations: Immutable.List<HttpRouteDestination>;
  timeout: number;
  retries: HttpRouteRetry;
  mirror: HttpRouteMirror;
  fault: HttpRouteFault;
  delay: HttpRouteDelay;
  cors: HttpRouteCORS;
}>;

export interface LoadHttpRoutesAction {
  type: typeof LOAD_ROUTES_FULLFILLED;
  payload: {
    httpRoutes: Immutable.List<HttpRoute>;
  };
}

export interface RoutesStateAction {
  type: typeof LOAD_ROUTES_PENDING | typeof LOAD_ROUTES_FAILED;
}

export type RouteActions = LoadHttpRoutesAction | RoutesStateAction;
