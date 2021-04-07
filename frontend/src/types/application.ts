import { MetricList, Metrics } from "./common";
import { ComponentLike } from "./componentTemplate";

export const CREATE_APPLICATION = "CREATE_APPLICATION";
export const DELETE_APPLICATION = "DELETE_APPLICATION";
export const SET_IS_SUBMITTING_APPLICATION = "SET_IS_SUBMITTING_APPLICATION";
export const SET_IS_SUBMITTING_APPLICATION_COMPONENT = "SET_IS_SUBMITTING_APPLICATION_COMPONENT";
export const CREATE_COMPONENT = "CREATE_COMPONENT";
export const UPDATE_COMPONENT = "UPDATE_COMPONENT";
export const DELETE_COMPONENT = "DELETE_COMPONENT";
export const LOAD_ALL_NAMESAPCES_COMPONETS = "LOAD_ALL_NAMESAPCES_COMPONETS"; // for application list page
export const LOAD_COMPONENTS_PENDING = "LOAD_COMPONENTS_PENDING";
export const LOAD_COMPONENTS_FULFILLED = "LOAD_COMPONENTS_FULFILLED";
export const LOAD_COMPONENTS_FAILED = "LOAD_COMPONENTS_FAILED";

export interface EnvItem {
  name: string;
  type: string;
  value: string;
}

type ServiceStatus = {
  name: string;
  clusterIP: string;
  ports: {
    name: string;
    protocol: string;
    port: number;
    targetPort: number;
  }[];
};

type PodWarning = { message: string };

export type PodStatus = {
  name: string;
  node: string;
  status: string;
  statusText: string;
  message: string;
  podIps: string[];
  hostIp: string;
  phase: string;
  createTimestamp: number;
  startTimestamp: number;
  isTerminating: boolean;
  restarts: number;
  containers: {
    name: string;
    restartCount: number;
    ready: boolean;
    started: boolean;
    startedAt: number;
  }[];
  warnings: PodWarning[];
  metrics: Metrics;
};

export type JobStatus = {
  name: string;
  active: number;
  completionTimestamp: number;
  completions: number;
  createTimestamp: number;
  creationTimestamp: number;
  failed: number;
  parallelism: number;
  startTimestamp: number;
  succeeded: number;
};

export interface ApplicationComponent extends ComponentLike {}

export interface ApplicationComponentDetails extends ApplicationComponent {
  metrics: Metrics;
  pods: PodStatus[];
  jobs?: JobStatus[];
  services: ServiceStatus[];
  istioMetricHistories: IstioMetricHistories;
}

type IstioMetricHistories = {
  httpRequestsTotal?: MetricList;
  httpRespCode2XXCount?: MetricList;
  httpRespCode4XXCount?: MetricList;
  httpRespCode5XXCount?: MetricList;
  httpRequestBytes?: MetricList;
  httpResponseBytes?: MetricList;
  tcpSentBytesTotal?: MetricList;
  tcpReceivedBytesTotal?: MetricList;
};

export type Application = {
  name: string;
  istioMetricHistories?: IstioMetricHistories;
};

export interface ApplicationDetails extends Application {
  status: string; // Active or Terminating
  metrics: Metrics;
  roles: string[];
}

interface CreateApplicationAction {
  type: typeof CREATE_APPLICATION;
  payload: {
    application: ApplicationDetails;
  };
}

interface DeleteApplicationAction {
  type: typeof DELETE_APPLICATION;
  payload: {
    applicationName: string;
  };
}

interface CreateComponentAction {
  type: typeof CREATE_COMPONENT;
  payload: {
    applicationName: string;
    component: ApplicationComponentDetails;
  };
}

interface UpdateComponentAction {
  type: typeof UPDATE_COMPONENT;
  payload: {
    applicationName: string;
    component: ApplicationComponentDetails;
  };
}

interface DeleteComponentAction {
  type: typeof DELETE_COMPONENT;
  payload: {
    applicationName: string;
    componentName: string;
  };
}

interface LoadComponentsPendingAction {
  type: typeof LOAD_COMPONENTS_PENDING;
}

interface LoadComponentsFailedAction {
  type: typeof LOAD_COMPONENTS_FAILED;
}

interface LoadComponentsFulfilledAction {
  type: typeof LOAD_COMPONENTS_FULFILLED;
  payload: {
    applicationName: string;
    components: ApplicationComponentDetails[];
  };
}

interface LoadAllNamespacesComponentsAction {
  type: typeof LOAD_ALL_NAMESAPCES_COMPONETS;
  payload: {
    components: { [key: string]: ApplicationComponentDetails[] }; // key applicationName
  };
}

export interface SetIsSubmittingApplication {
  type: typeof SET_IS_SUBMITTING_APPLICATION;
  payload: {
    isSubmittingApplication: boolean;
  };
}

export interface SetIsSubmittingApplicationComponent {
  type: typeof SET_IS_SUBMITTING_APPLICATION_COMPONENT;
  payload: {
    isSubmittingApplicationComponent: boolean;
  };
}

export type ApplicationActions =
  | CreateApplicationAction
  | DeleteApplicationAction
  | SetIsSubmittingApplication
  | SetIsSubmittingApplicationComponent
  | CreateComponentAction
  | UpdateComponentAction
  | DeleteComponentAction
  | LoadComponentsFulfilledAction
  | LoadComponentsPendingAction
  | LoadComponentsFailedAction
  | LoadAllNamespacesComponentsAction;
