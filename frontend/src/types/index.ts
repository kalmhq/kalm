import { ThunkDispatch, ThunkAction } from "redux-thunk";
import { ActionTypes, actionTypes } from "redux-form/lib/actionTypes";
import { RootState } from "../reducers";
import { CommonActions } from "./common";
import { ApplicationActions } from "./application";
import { ComponentTemplateActions } from "./componentTemplate";
import { ConfigActions } from "./config";
import { UserActions } from "./user";
import { DependencyActions } from "./dependency";
import { NamespaceActions } from "./namespace";
import { NodeActions } from "./node";
import { RegistriesActions } from "./registry";
import { RouteActions } from "./route";
import { CertificateActions } from "./certificate";
import { ServiceActions } from "./service";
import { VolumeActions } from "./persistentVolume";
import { ClusterActions } from "./cluster";
import { RouterAction } from "connected-react-router";
import { TutorialActions } from "./tutorial";
import { FormAction } from "redux-form";

interface ReduxFormAction extends FormAction {
  type: keyof ActionTypes;
}

export type Actions =
  | ReduxFormAction
  | RouterAction
  | CommonActions
  | ApplicationActions
  | ComponentTemplateActions
  | ConfigActions
  | UserActions
  | DependencyActions
  | NamespaceActions
  | NodeActions
  | RegistriesActions
  | RouteActions
  | CertificateActions
  | ServiceActions
  | VolumeActions
  | ClusterActions
  | TutorialActions;

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;
export type TDispatch = ThunkDispatch<RootState, undefined, Actions>;
export type TDispatchProp = { dispatch: TDispatch };

export const StatusFailure = "Failure";
export const StatusSuccess = "Success";
export const SomethingWrong = "Something wrong";
