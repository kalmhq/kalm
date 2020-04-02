import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import { V1beta1CronJobStatus, V1DeploymentStatus } from "../model/models";
import { ComponentLikeContent } from "./componentTemplate";
import { Status } from "./common";

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

export interface ApplicationContent {
  isActive: boolean;
  name: string;
  namespace: string;
  sharedEnvs: Immutable.List<SharedEnv>;
  components: Immutable.List<ApplicationComponent>;
}

export interface ApplicationStatusContent {
  status: Status;
  components: Immutable.List<ComponentStatus>;
}

export interface ApplicationComponentContent extends ComponentLikeContent {}

export type ApplicationComponent = ImmutableMap<ApplicationComponentContent>;
export type Application = ImmutableMap<ApplicationContent>;
export type ApplicationStatus = ImmutableMap<ApplicationStatusContent>;

export type ListMeta = ImmutableMap<{
  totalCount: number;
  perPage: number;
  page: number;
}>;

export type PodInfo = ImmutableMap<{
  // Number of pods that are created.
  current: number;
  // Number of pods that are desired.
  desired?: number;
  // Number of pods that are currently running.
  running: number;
  // Number of pods that are currently waiting.
  pending: number;
  // Number of pods that are failed.
  failed: number;
  // Number of pods that are succeeded.
  succeeded: number;
  // Unique warning messages related to pods in this resource.
  warnings: any;
}>;

export type ComponentStatus = ImmutableMap<{
  name: string;
  workloadType: string;
  deploymentStatus?: V1DeploymentStatus;
  cronjobStatus?: V1beta1CronJobStatus;
  podsInfo: PodInfo;
  metrics: Metrics;
  pods: Immutable.List<PodStatus>;
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

export type MetricItem = ImmutableMap<{
  x: number;
  y: number;
}>;

export type MetricList = Immutable.List<MetricItem>;

export type Metrics = ImmutableMap<{
  cpu: MetricList;
  memory: MetricList;
}>;

export type ApplicationListItem = ImmutableMap<{
  name: string;
  namespace: string;
  createdAt: string;
  isActive: boolean;
  components: Immutable.List<ComponentStatus>;
  metrics: Metrics;
}>;

export type ApplicationList = Immutable.List<ApplicationListItem>;

// export type ApplicationDetail = ImmutableMap<{
//   name: string;
//   namespace: string;
//   isActive: boolean;
//   sharedEnvs: Immutable.List<V1EnvVar>;
//   components: Immutable.List<V1alpha1ApplicationSpecComponents>;
// }>;

export interface CreateApplicationAction {
  type: typeof CREATE_APPLICATION;
  payload: {
    application: Application;
  };
}

export interface DuplicateApplicationAction {
  type: typeof DUPLICATE_APPLICATION;
  payload: {
    application: Application;
  };
}

export interface UpdateApplicationAction {
  type: typeof UPDATE_APPLICATION;
  payload: {
    application: Application;
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
    applicationList: ApplicationList;
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
    application: Application;
    podNames: Immutable.List<string>;
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
