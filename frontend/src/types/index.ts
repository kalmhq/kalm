import { RootState } from "configureStore";
import { RouterAction } from "connected-react-router";
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { DeployAccessTokenActions } from "types/deployAccessToken";
import { VolumeActions } from "types/disk";
import { DomainsActions } from "types/domains";
import { RoleBindingsActions } from "types/member";
import { Metadata } from "types/meta";
import { SSOConfigActions } from "types/sso";
import { ApplicationActions } from "./application";
import { CertificateActions } from "./certificate";
import { ClusterActions } from "./cluster";
import { CommonActions } from "./common";
import { DebounceActions } from "./debounce";
import { Deployment, Namespace } from "./k8s";
import { NamespaceActions } from "./namespace";
import { NodeActions } from "./node";
import { RegistriesActions } from "./registry";
import { ResourceActions } from "./resources";
import { RouteActions } from "./route";
import { ServiceActions } from "./service";
import { TutorialActions } from "./tutorial";

export type Actions =
  | RouterAction
  | CommonActions
  | ApplicationActions
  | NamespaceActions
  | NodeActions
  | RegistriesActions
  | RouteActions
  | CertificateActions
  | ServiceActions
  | VolumeActions
  | ClusterActions
  | TutorialActions
  | ResourceActions
  | DebounceActions
  | SSOConfigActions
  | DomainsActions
  | DeployAccessTokenActions
  | RoleBindingsActions
  | SteamEventAction;

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;
export type TDispatch = ThunkDispatch<RootState, undefined, Actions>;
export type TDispatchProp = { dispatch: TDispatch };

export const StatusFailure = "Failure";
export const StatusSuccess = "Success";
export const SomethingWrong = "Something wrong";

export const StreamingEventTypeAdded = "ADDED";
export const StreamingEventTypeDeleted = "DELETED";
export const StreamingEventTypeModified = "MODIFIED";
export type StreamingEventType =
  | typeof StreamingEventTypeAdded
  | typeof StreamingEventTypeDeleted
  | typeof StreamingEventTypeModified;

export type SteamEventAction<T = Namespace | Deployment> = {
  type: StreamingEventType;
  kind: "Namespace" | "Deployment";
  data: T;
};

export interface K8sObject {
  kind: string;
  metadata: Metadata;
}
