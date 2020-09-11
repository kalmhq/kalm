export const SET_DOMAIN_A_RECORDS = "SET_DOMAIN_A_RECORDS";
export const SET_DOMAIN_CNAME = "SET_DOMAIN_CNAME";
export const SET_DOMAIN_NS = "SET_DOMAIN_NS";
export const LOADED_DOMAIN_STATUS = "LOADED_DOMAIN_STATUS";
export const INIT_DOMAIN_STATUS = "INIT_DOMAIN_STATUS";

export interface Domain {
  aRecords: string[];
  cname: string;
  domain: string;
  ns: string[];
  isLoaded: boolean;
}

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

export interface SetDomainNS {
  type: typeof SET_DOMAIN_NS;
  payload: {
    domain: string;
    ns: string[];
  };
}

export interface CheckedDomainStatus {
  type: typeof LOADED_DOMAIN_STATUS;
  payload: {
    domain: string;
  };
}

export interface InitDomainStatus {
  type: typeof INIT_DOMAIN_STATUS;
  payload: {
    domain: string;
  };
}

export type DomainActions = SetDomainARecords | SetDomainCname | SetDomainNS | CheckedDomainStatus | InitDomainStatus;
