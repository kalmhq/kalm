import Immutable from "immutable";
import { ImmutableMap } from "typings";

export const SET_DOMAIN_A_RECORDS = "SET_DOMAIN_A_RECORDS";
export const SET_DOMAIN_CNAME = "SET_DOMAIN_CNAME";

export interface Domain {
  aRecords: Immutable.List<string>;
  cname: string;
}

export type DomainType = ImmutableMap<Domain>;

export interface SetDomainARecords {
  type: typeof SET_DOMAIN_A_RECORDS;
  payload: {
    domain: string;
    aRecords: string[];
  };
}

export interface SetDomainCname {
  type: typeof SET_DOMAIN_CNAME;
  payload: {
    domain: string;
    cname: string;
  };
}

export type DomainActions = SetDomainARecords | SetDomainCname;
