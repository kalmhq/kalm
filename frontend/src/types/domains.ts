export const LOAD_DOMAINS_PENDING = "LOAD_DOMAINS_PENDING";
export const LOAD_DOMAINS_FAILED = "LOAD_DOMAINS_FAILED";
export const LOAD_DOMAINS_FULFILLED = "LOAD_DOMAINS_FULFILLED";

export const CREATE_DOMAIN_PENDING = "CREATE_DOMAIN_PENDING";
export const CREATE_DOMAIN_FAILED = "CREATE_DOMAIN_FAILED";
export const CREATE_DOMAIN_FULFILLED = "CREATE_DOMAIN_FULFILLED";

export const DELETE_DOMAIN_PENDING = "DELETE_DOMAIN_PENDING";
export const DELETE_DOMAIN_FAILED = "DELETE_DOMAIN_FAILED";
export const DELETE_DOMAIN_FULFILLED = "DELETE_DOMAIN_FULFILLED";

export interface Domain {
  name: string;
  domain: string;
  recordType: "CNAME" | "A";
  target: string;
}

export interface DomainCreation {
  domain: string;
}

export interface DomainRequestStatusAction {
  type:
    | typeof LOAD_DOMAINS_PENDING
    | typeof LOAD_DOMAINS_FAILED
    | typeof CREATE_DOMAIN_PENDING
    | typeof CREATE_DOMAIN_FAILED
    | typeof DELETE_DOMAIN_PENDING
    | typeof DELETE_DOMAIN_FAILED;
}

export interface LoadDomainsAction {
  type: typeof LOAD_DOMAINS_FULFILLED;
  payload: {
    domains: Domain[];
  };
}

export interface CreateDomainAction {
  type: typeof CREATE_DOMAIN_FULFILLED;
  payload: {
    domain: Domain;
  };
}

export interface DeleteDomainAction {
  type: typeof DELETE_DOMAIN_FULFILLED;
  payload: {
    name: string;
  };
}

export type DomainsActions = DomainRequestStatusAction | LoadDomainsAction | CreateDomainAction | DeleteDomainAction;
