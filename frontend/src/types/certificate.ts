import Immutable from "immutable";
import { ImmutableMap } from "typings";

export const LOAD_CERTIFICATES_FULFILLED = "LOAD_CERTIFICATES_FULFILLED";
export const LOAD_CERTIFICATES_PENDING = "LOAD_CERTIFICATES_PENDING";
export const LOAD_CERTIFICATES_FAILED = "LOAD_CERTIFICATES_FAILED";
export const SET_IS_SUBMITTING_CERTIFICATE = "SET_IS_SUBMITTING_CERTIFICATE";
export const DELETE_CERTIFICATE = "DELETE_CERTIFICATE";

export interface LoadCertificatesPendingAction {
  type: typeof LOAD_CERTIFICATES_PENDING;
}

export interface LoadCertificatesFailedAction {
  type: typeof LOAD_CERTIFICATES_FAILED;
}

export interface LoadCertificatesAction {
  type: typeof LOAD_CERTIFICATES_FULFILLED;
  payload: {
    certificates: Immutable.List<Certificate>;
  };
}

export interface SetIsSubmittingCertificate {
  type: typeof SET_IS_SUBMITTING_CERTIFICATE;
  payload: {
    isSubmittingCertificate: boolean;
  };
}

export interface DeleteCertificate {
  type: typeof DELETE_CERTIFICATE;
  payload: {
    name: string;
  };
}

export type CertificateList = Immutable.List<Certificate>;

export type CertificateForm = ImmutableMap<Certificate>;

export type Certificate = ImmutableMap<CertificateContent>;

export interface CertificateContent {
  name: string;
  isSelfManaged: boolean;
  selfManagedCertContent: string;
  selfManagedCertPrivateKey: string;
  httpsCertIssuer: string;
  domains: string[];
}

export type CertificateActions =
  | LoadCertificatesPendingAction
  | LoadCertificatesFailedAction
  | LoadCertificatesAction
  | SetIsSubmittingCertificate
  | DeleteCertificate;
