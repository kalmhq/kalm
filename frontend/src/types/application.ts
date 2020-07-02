import Immutable from "immutable";
import { ImmutableMap } from "typings";
import { ComponentLikeContent } from "./componentTemplate";
import { Metrics } from "./common";

export const CREATE_APPLICATION = "CREATE_APPLICATION";
export const UPDATE_APPLICATION = "UPDATE_APPLICATION";
export const DELETE_APPLICATION = "DELETE_APPLICATION";
export const DUPLICATE_APPLICATION = "DUPLICATE_APPLICATION";
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
export const ADD_OR_UPDATE_SERVICE = "ADD_OR_UPDATE_SERVICE";
export const DELETE_SERVICE = "DELETE_SERVICE";
export const ADD_OR_UPDATE_POD = "ADD_OR_UPDATE_POD";
export const DELETE_POD = "DELETE_POD";
// export const LOAD_APPLICATION_PLUGINS_FULFILLED = "LOAD_APPLICATION_PLUGINS_FULFILLED";
export const LOAD_COMPONENT_PLUGINS_FULFILLED = "LOAD_COMPONENT_PLUGINS_FULFILLED";

export interface ComponentPlugin {
  name: string;
  src: string;
  configSchema: any;
}

export interface ApplicationPlugin {
  name: string;
  src: string;
  configSchema: any;
}

export type SharedEnv = ImmutableMap<{
  name: string;
  type: string;
  value: string;
}>;

export type EnvItem = SharedEnv;

export type ServiceStatus = ImmutableMap<{
  name: string;
  clusterIP: string;
  ports: Immutable.List<
    ImmutableMap<{
      name: string;
      protocol: string;
      port: number;
      targetPort: number;
    }>
  >;
}>;

export type PodWarning = ImmutableMap<{ message: string }>;

export type PodStatus = ImmutableMap<{
  name: string;
  node: string;
  status: string;
  statusText: string;
  message: string;
  podIps: string[];
  hostIp: string;
  createTimestamp: number;
  startTimestamp: number;
  isTerminating: boolean;
  restarts: number;
  containers: Immutable.List<
    ImmutableMap<{
      name: string;
      restartCount: number;
      ready: boolean;
      started: boolean;
      startedAt: number;
    }>
  >;
  warnings: Immutable.List<PodWarning>;
  metrics: Metrics;
}>;

export interface ApplicationComponentContent extends ComponentLikeContent {}

export interface ApplicationComponentDetailsContent extends ApplicationComponentContent {
  metrics: Metrics;
  pods: Immutable.List<PodStatus>;
  services: Immutable.List<ServiceStatus>;
}

export type ApplicationComponent = ImmutableMap<ApplicationComponentContent>;
export type ApplicationComponentDetails = ImmutableMap<ApplicationComponentDetailsContent>;

export interface ApplicationContent {
  name: string;
}

export type Application = ImmutableMap<ApplicationContent>;

export interface ApplicationDetailsContent extends ApplicationContent {
  status: string; // Active or Terminating
  components: Immutable.List<ApplicationComponentDetails>;
  metrics: Metrics;
  roles: Immutable.List<string>;
}

export type ApplicationDetails = ImmutableMap<ApplicationDetailsContent>;

export interface CreateApplicationAction {
  type: typeof CREATE_APPLICATION;
  payload: {
    application: ApplicationDetails;
  };
}

export interface DuplicateApplicationAction {
  type: typeof DUPLICATE_APPLICATION;
  payload: {
    application: ApplicationDetails;
  };
}

export interface UpdateApplicationAction {
  type: typeof UPDATE_APPLICATION;
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

export interface AddOrUpdateServiceAction {
  type: typeof ADD_OR_UPDATE_SERVICE;
  payload: {
    applicationName: string;
    componentName: string;
    service: ServiceStatus;
  };
}

export interface DeleteServiceAction {
  type: typeof DELETE_SERVICE;
  payload: {
    applicationName: string;
    componentName: string;
    serviceName: string;
  };
}

export interface AddOrUpdatePodAction {
  type: typeof ADD_OR_UPDATE_POD;
  payload: {
    applicationName: string;
    componentName: string;
    pod: PodStatus;
  };
}

export interface DeletePodAction {
  type: typeof DELETE_POD;
  payload: {
    applicationName: string;
    componentName: string;
    podName: string;
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
    applicationList: Immutable.List<ApplicationDetails>;
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

export interface LoadComponentPluginsFulfilledAction {
  type: typeof LOAD_COMPONENT_PLUGINS_FULFILLED;
  payload: {
    componentPlugins: ApplicationPlugin[];
  };
}

export type ApplicationActions =
  | CreateApplicationAction
  | UpdateApplicationAction
  | DeleteApplicationAction
  | DuplicateApplicationAction
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
  | AddOrUpdateServiceAction
  | DeleteServiceAction
  | AddOrUpdatePodAction
  | DeletePodAction
  | LoadComponentPluginsFulfilledAction;
