import { RouterAction } from "connected-react-router";
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { RootState } from "store";
import { DeployAccessTokenActions } from "types/deployAccessToken";
import { VolumeActions } from "types/disk";
import { DomainsActions } from "types/domains";
import { Deployment, Namespace } from "types/k8s";
import { RoleBindingsActions } from "types/member";
import { Metadata } from "types/meta";
import { SSOConfigActions } from "types/sso";
import { ApplicationActions } from "./application";
import { CertificateActions } from "./certificate";
import { ClusterActions } from "./cluster";
import { CommonActions } from "./common";
import { DebounceActions } from "./debounce";
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
export const SomethingWrong = "Something wrong";

const StreamingEventTypeAdded = "ADDED";
const StreamingEventTypeDeleted = "DELETED";
const StreamingEventTypeModified = "MODIFIED";
export type StreamingEventType =
  | typeof StreamingEventTypeAdded
  | typeof StreamingEventTypeDeleted
  | typeof StreamingEventTypeModified;

export type Resources = Namespace | Deployment;

type SteamEventAction<T = Resources> = {
  type: StreamingEventType;
  payload: T;
};

export interface K8sObject {
  kind: string;
  apiVersion: string;
  metadata: Metadata;
}
