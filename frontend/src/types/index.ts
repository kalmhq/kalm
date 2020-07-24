import { RouterAction } from "connected-react-router";
import { FormAction } from "redux-form";
import { ActionTypes } from "redux-form/lib/actionTypes";
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { RootState } from "reducers";
import { ApplicationActions } from "./application";
import { CertificateActions } from "./certificate";
import { ClusterActions } from "./cluster";
import { CommonActions } from "./common";
import { NamespaceActions } from "./namespace";
import { NodeActions } from "./node";
import { VolumeActions } from "types/disk";
import { RegistriesActions } from "./registry";
import { RouteActions } from "./route";
import { ServiceActions } from "./service";
import { TutorialActions } from "./tutorial";
import { UserActions } from "./user";
import { ResourceActions } from "./resources";
import { DebounceActions } from "./debounce";
import { SSOConfigActions } from "types/sso";
import { DomainActions } from "./domain";

interface ReduxFormAction extends FormAction {
  type: keyof ActionTypes;
}

export type Actions =
  | ReduxFormAction
  | RouterAction
  | CommonActions
  | ApplicationActions
  | UserActions
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
  | DomainActions;

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;
export type TDispatch = ThunkDispatch<RootState, undefined, Actions>;
export type TDispatchProp = { dispatch: TDispatch };

export const StatusFailure = "Failure";
export const StatusSuccess = "Success";
export const SomethingWrong = "Something wrong";
