import { RouterAction } from "connected-react-router";
import { RootState } from "reducers";
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { DeployAccessTokenActions } from "types/deployAccessToken";
import { VolumeActions } from "types/disk";
import { DomainsActions } from "types/domains";
import { RoleBindingsActions } from "types/member";
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
  | RoleBindingsActions;

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;
export type TDispatch = ThunkDispatch<RootState, undefined, Actions>;
export type TDispatchProp = { dispatch: TDispatch };

export const StatusFailure = "Failure";
export const StatusSuccess = "Success";
export const SomethingWrong = "Something wrong";
