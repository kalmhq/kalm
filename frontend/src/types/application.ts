import { MetricList, Metrics } from "./common";
import { ComponentLike } from "./componentTemplate";

export const CREATE_APPLICATION = "CREATE_APPLICATION";
export const DELETE_APPLICATION = "DELETE_APPLICATION";
export const LOAD_APPLICATIONS_PENDING = "LOAD_APPLICATIONS_PENDING";
export const LOAD_APPLICATIONS_FULFILLED = "LOAD_APPLICATIONS_FULFILLED";
export const LOAD_APPLICATIONS_FAILED = "LOAD_APPLICATIONS_FAILED";
export const LOAD_APPLICATION_PENDING = "LOAD_APPLICATION_PENDING";
export const LOAD_APPLICATION_FULFILLED = "LOAD_APPLICATION_FULFILLED";
export const LOAD_APPLICATION_FAILED = "LOAD_APPLICATION_FAILED";
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

export type ServiceStatus = {
  name: string;
  clusterIP: string;
  ports: {
    name: string;
    protocol: string;
    port: number;
    targetPort: number;
  }[];
};

export type PodWarning = { message: string };

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

export type IstioMetricHistories = {
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

export interface CreateApplicationAction {
  type: typeof CREATE_APPLICATION;
  payload: {
    application: ApplicationDetails;
  };
}

export interface DeleteApplicationAction {
  type: typeof DELETE_APPLICATION;
  payload: {
    applicationName: string;
  };
}

export interface CreateComponentAction {
  type: typeof CREATE_COMPONENT;
  payload: {
    applicationName: string;
    component: ApplicationComponentDetails;
  };
}

export interface UpdateComponentAction {
  type: typeof UPDATE_COMPONENT;
  payload: {
    applicationName: string;
    component: ApplicationComponentDetails;
  };
}

export interface DeleteComponentAction {
  type: typeof DELETE_COMPONENT;
  payload: {
    applicationName: string;
    componentName: string;
  };
}

export interface LoadComponentsPendingAction {
  type: typeof LOAD_COMPONENTS_PENDING;
}

export interface LoadComponentsFailedAction {
  type: typeof LOAD_COMPONENTS_FAILED;
}

export interface LoadComponentsFulfilledAction {
  type: typeof LOAD_COMPONENTS_FULFILLED;
  payload: {
    applicationName: string;
    components: ApplicationComponentDetails[];
  };
}

export interface LoadAllNamespacesComponentsAction {
  type: typeof LOAD_ALL_NAMESAPCES_COMPONETS;
  payload: {
    components: { [key: string]: ApplicationComponentDetails[] }; // key applicationName
  };
}

export interface LoadApplicationsPendingAction {
  type: typeof LOAD_APPLICATIONS_PENDING;
}

export interface LoadApplicationsFailedAction {
  type: typeof LOAD_APPLICATIONS_FAILED;
}

export interface LoadApplicationsFulfilledAction {
  type: typeof LOAD_APPLICATIONS_FULFILLED;
  payload: {
    applicationList: ApplicationDetails[];
  };
}

export interface LoadApplicationPendingAction {
  type: typeof LOAD_APPLICATION_PENDING;
}

export interface LoadApplicationFailedAction {
  type: typeof LOAD_APPLICATION_FAILED;
}

export interface LoadApplicationFulfilledAction {
  type: typeof LOAD_APPLICATION_FULFILLED;
  payload: {
    application: ApplicationDetails;
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
  | LoadApplicationsFulfilledAction
  | LoadApplicationsPendingAction
  | LoadApplicationsFailedAction
  | LoadApplicationPendingAction
  | LoadApplicationFulfilledAction
  | LoadApplicationFailedAction
  | SetIsSubmittingApplication
  | SetIsSubmittingApplicationComponent
  | CreateComponentAction
  | UpdateComponentAction
  | DeleteComponentAction
  | LoadComponentsFulfilledAction
  | LoadComponentsPendingAction
  | LoadComponentsFailedAction
  | LoadAllNamespacesComponentsAction;
