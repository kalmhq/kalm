import Immutable from "immutable";
import { ImmutableMap } from "typings";

export const LOAD_ROUTES_FULLFILLED = "LOAD_ROUTES_FULLFILLED";
export const LOAD_ROUTES_PENDING = "LOAD_ROUTES_PENDING";
export const LOAD_ROUTES_FAILED = "LOAD_ROUTES_FAILED";

export const newEmptyRouteForm = (): HttpRouteForm => {
  return Immutable.fromJS({
    hosts: [],
    paths: ["/"],
    conditions: [],
    destinations: [],
    httpRedirectToHttps: false,
    schemes: ["http"],
    methods: ["GET"],
    timeout: 5,
    retries: {
      attempts: 3,
      perTtyTimeoutSeconds: 2,
      retryOn: ["gateway-error", "connect-failure", "refused-stream"]
    },
    methodsMode: methodsModeAll
  });
};

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

interface HttpRouteContent {
  hosts: Immutable.List<string>;
  paths: Immutable.List<string>;
  methods: Immutable.List<string>;
  schemes: Immutable.List<string>;
  stripPath: boolean;
  conditions: Immutable.List<HttpRouteCondition>;
  destinations: Immutable.List<HttpRouteDestination>;
  httpRedirectToHttps: boolean;
  timeout: number;
  retries: HttpRouteRetry;
  mirror: HttpRouteMirror;
  fault: HttpRouteFault;
  delay: HttpRouteDelay;
  cors: HttpRouteCORS;
}

export type HttpRoute = ImmutableMap<HttpRouteContent>;

export const methodsModeAll = "all";
export const methodsModeSpecific = "specific";

export interface HttpRouteFormContent extends HttpRouteContent {
  methodsMode: string;
}

export type HttpRouteForm = ImmutableMap<HttpRouteFormContent>;

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
