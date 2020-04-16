import { ImmutableMap } from "typings";

export interface LoginStatusContent {
  authorized: boolean;
  isAdmin: boolean;
  entity: string;
  csrf: string;
}

export type LoginStatus = ImmutableMap<LoginStatusContent>;
