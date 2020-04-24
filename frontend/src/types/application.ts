import Immutable from "immutable";
import { ImmutableMap } from "../typings";
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

export type SharedEnv = ImmutableMap<{
  name: string;
  type: string;
  value: string;
}>;

export type EnvItem = SharedEnv;
export type EnvItems = Immutable.List<EnvItem>;

export type ListMeta = ImmutableMap<{
  totalCount: number;
  perPage: number;
  page: number;
}>;

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
  warnings: Immutable.List<
    ImmutableMap<{
      message: string;
    }>
  >;
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
export type ApplicationComponentDetailsList = Immutable.List<ApplicationComponentDetails>;

export interface ApplicationContent {
  name: string;
  namespace: string;
  isActive: boolean;
  sharedEnvs: Immutable.List<SharedEnv>;
  // TODO correct
  plugins?: any;

  components: ApplicationComponentDetailsList;
}

export type Application = ImmutableMap<ApplicationContent>;

export interface ApplicationDetailsContent extends ApplicationContent {
  metrics: Metrics;
  roles: Immutable.List<string>;
}

export type ApplicationDetails = ImmutableMap<ApplicationDetailsContent>;

export type ApplicationDetailsList = Immutable.List<ApplicationDetails>;

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

export interface LoadApplicationsPendingAction {
  type: typeof LOAD_APPLICATIONS_PENDING;
}

export interface LoadApplicationsFailedAction {
  type: typeof LOAD_APPLICATIONS_FAILED;
}

export interface LoadApplicationsFulfilledAction {
  type: typeof LOAD_APPLICATIONS_FULFILLED;
  payload: {
    applicationList: ApplicationDetailsList;
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
  | SetIsSubmittingApplicationComponent;
