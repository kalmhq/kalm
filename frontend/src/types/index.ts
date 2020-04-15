import { ThunkDispatch, ThunkAction } from "redux-thunk";
import { RootState } from "../reducers";
import { CommonActions } from "./common";
import { ApplicationActions } from "./application";
import { ComponentTemplateActions } from "./componentTemplate";
import { ConfigActions } from "./config";
import { UserActions } from "./user";
import { DependencyActions } from "./dependency";
import { NamespaceActions } from "./namespace";
import { NodeActions } from "./node";

export type Actions =
  | CommonActions
  | ApplicationActions
  | ComponentTemplateActions
  | ConfigActions
  | UserActions
  | DependencyActions
  | NamespaceActions
  | NodeActions;

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;
export type TDispatch = ThunkDispatch<RootState, undefined, Actions>;
export type TDispatchProp = { dispatch: TDispatch };

export const StatusFailure = "Failure";
export const StatusSuccess = "Success";
export const SomethingWrong = "Something wrong";
