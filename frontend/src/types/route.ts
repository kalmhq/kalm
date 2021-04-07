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

export const AllHttpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "CONNECT", "TRACE"];

export interface HttpRouteCondition {
  type: string;
  name: string;
  operator: string;
  value: string;
}

export interface HttpRouteDestination {
  host: string;
  weight: number;
}

export interface HttpRouteDestinationStatus {
  status: string;
  error: string;
}

interface HttpRouteRetry {
  attempts: number;
  perTtyTimeoutSeconds: number;
  retryOn: string[];
}

interface HttpRouteMirror {
  destination: HttpRouteDestination;
  percentage: number;
}

interface HttpRouteFault {
  percentage: number;
  errorStatus: number;
}

interface HttpRouteDelay {
  percentage: number;
  delaySeconds: number;
}

interface HttpRouteCORS {
  allowOrigin: string[];
  allowMethods: string[];
  allowCredentials: boolean;
  allowHeaders: string[];
  maxAge: number;
}

export const methodsModeAll = "all";
export const methodsModeSpecific = "specific";
export const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD", "TRACE", "CONNECT"];

export interface HttpRoute {
  name: string;
  hosts: string[];
  paths: string[];
  methods: string[];
  schemes: string[];
  stripPath?: boolean;
  conditions?: HttpRouteCondition[];
  destinations: HttpRouteDestination[];
  destinationsStatus?: HttpRouteDestinationStatus[];
  httpRedirectToHttps?: boolean;
  timeout?: number;
  retries?: HttpRouteRetry;
  mirror?: HttpRouteMirror;
  fault?: HttpRouteFault;
  delay?: HttpRouteDelay;
  cors?: HttpRouteCORS;
  methodsMode?: string;
}

export const newEmptyRouteForm = (defaultDomain?: string): HttpRoute => {
  return {
    name: "http-route-" + ID(),
    hosts: [defaultDomain ?? ""],
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
  };
};

interface LoadHttpRoutesAction {
  type: typeof LOAD_ROUTES_FULFILLED;
  payload: {
    httpRoutes: HttpRoute[];
  };
}

interface DeleteRouteAction {
  type: typeof DELETE_ROUTE_FULFILLED;
  payload: {
    route: HttpRoute;
  };
}

interface CreateRouteAction {
  type: typeof CREATE_ROUTE_FULFILLED;
  payload: {
    route: HttpRoute;
  };
}

interface UpdateRouteAction {
  type: typeof UPDATE_ROUTE_FULFILLED;
  payload: {
    route: HttpRoute;
  };
}

interface RoutesStateAction {
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
