import Immutable from "immutable";

export const LOAD_CERTFICATES_FULFILLED = "LOAD_CERTFICATES_FULFILLED";
export const LOAD_CERTFICATES_PENDING = "LOAD_CERTFICATES_PENDING";
export const LOAD_CERTFICATES_FAILED = "LOAD_CERTFICATES_FAILED";

export interface LoadCertficatesPendingAction {
  type: typeof LOAD_CERTFICATES_PENDING;
}

export interface LoadCertficatesFailedAction {
  type: typeof LOAD_CERTFICATES_FAILED;
}

export interface LoadCertficatesAction {
  type: typeof LOAD_CERTFICATES_FULFILLED;
  payload: {
    certficates: Immutable.List<Certificate>;
    namespace: string;
  };
}

export type CertficateList = Immutable.List<Certificate>;

export interface Certificate {
  name: string;
  isSelfManaged: boolean;
  selfManagedCertContent: string;
  selfManagedCertPrivateKey: string;
  httpsCertIssuer: string;
  domains: string[];
}

export type CertficateActions = LoadCertficatesPendingAction | LoadCertficatesFailedAction | LoadCertficatesAction;
