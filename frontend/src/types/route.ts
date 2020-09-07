import Immutable from "immutable";
import { ImmutableMap } from "typings";
import { ID } from "utils";

export const LOAD_ROUTES_FULFILLED = "LOAD_ROUTES_FULFILLED";
export const LOAD_ROUTES_PENDING = "LOAD_ROUTES_PENDING";
export const LOAD_ROUTES_FAILED = "LOAD_ROUTES_FAILED";

export const CREATE_ROUTE_FULFILLED = "CREATE_ROUTE_FULFILLED";
export const CREATE_ROUTE_PENDING = "CREATE_ROUTE_PENDING";
export const CREATE_ROUTE_FAILED = "CREATE_ROUTE_FAILED";

export const UPDATE_ROUTE_FULFILLED = "UPDATE_ROUTE_FULFILLED";
export const UPDATE_ROUTE_PENDING = "UPDATE_ROUTE_PENDING";
export const UPDATE_ROUTE_FAILED = "UPDATE_ROUTE_FAILED";

export const DELETE_ROUTE_PENDING = "DELETE_ROUTE_PENDING";
export const DELETE_ROUTE_FULFILLED = "DELETE_ROUTE_FULFILLED";
export const DELETE_ROUTE_FAILED = "DELETE_ROUTE_FAILED";

export const AllHttpMethods = Immutable.List<string>([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "CONNECT",
  "TRACE",
]);

export type HttpRouteCondition = ImmutableMap<{
  type: string;
  name: string;
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

export interface HttpRouteContent {
  name: string;
  namespace: string;
  hosts: Immutable.List<string>;
  paths: Immutable.List<string>;
  methods: Immutable.List<string>;
  schemes: Immutable.List<string>;
  stripPath?: boolean;
  conditions?: Immutable.List<HttpRouteCondition>;
  destinations: Immutable.List<HttpRouteDestination>;
  httpRedirectToHttps?: boolean;
  timeout?: number;
  retries?: HttpRouteRetry;
  mirror?: HttpRouteMirror;
  fault?: HttpRouteFault;
  delay?: HttpRouteDelay;
  cors?: HttpRouteCORS;
}

export type HttpRoute = ImmutableMap<HttpRouteContent>;

export const methodsModeAll = "all";
export const methodsModeSpecific = "specific";
export const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD", "TRACE", "CONNECT"];

export const newEmptyRouteForm = (): HttpRouteForm => {
  return Immutable.fromJS({
    namespace: "kalm-system",
    name: "http-route-" + ID(),
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
      retryOn: ["gateway-error", "connect-failure", "refused-stream"],
    },
    methodsMode: methodsModeAll,
  });
};

export interface HttpRouteFormContent extends HttpRouteContent {
  methodsMode: string;
}

export type HttpRouteForm = ImmutableMap<HttpRouteFormContent>;

export interface LoadHttpRoutesAction {
  type: typeof LOAD_ROUTES_FULFILLED;
  payload: {
    httpRoutes: Immutable.List<HttpRoute>;
  };
}

export interface DeleteRouteAction {
  type: typeof DELETE_ROUTE_FULFILLED;
  payload: {
    route: HttpRoute;
  };
}

export interface CreateRouteAction {
  type: typeof CREATE_ROUTE_FULFILLED;
  payload: {
    route: HttpRoute;
  };
}

export interface UpdateRouteAction {
  type: typeof UPDATE_ROUTE_FULFILLED;
  payload: {
    route: HttpRoute;
  };
}

export interface RoutesStateAction {
  type:
    | typeof LOAD_ROUTES_PENDING
    | typeof LOAD_ROUTES_FAILED
    | typeof DELETE_ROUTE_PENDING
    | typeof DELETE_ROUTE_FAILED
    | typeof CREATE_ROUTE_PENDING
    | typeof CREATE_ROUTE_FAILED
    | typeof UPDATE_ROUTE_PENDING
    | typeof UPDATE_ROUTE_FAILED;
}

export type RouteActions =
  | LoadHttpRoutesAction
  | RoutesStateAction
  | DeleteRouteAction
  | CreateRouteAction
  | UpdateRouteAction;
