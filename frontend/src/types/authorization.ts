import { ImmutableMap } from "typings";

export interface LoginStatusContent {
  authorized: boolean;
  isAdmin: boolean;
}

export type LoginStatus = ImmutableMap<LoginStatusContent>;
