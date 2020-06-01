import Immutable from "immutable";
import { ImmutableMap } from "typings";

export const LOAD_CERTIFICATES_FULFILLED = "LOAD_CERTIFICATES_FULFILLED";
export const LOAD_CERTIFICATES_PENDING = "LOAD_CERTIFICATES_PENDING";
export const LOAD_CERTIFICATES_FAILED = "LOAD_CERTIFICATES_FAILED";
export const SET_IS_SUBMITTING_CERTIFICATE = "SET_IS_SUBMITTING_CERTIFICATE";
export const SET_IS_SHOW_ADD_CERTIFICATE_MODAL = "SET_IS_SHOW_ADD_CERTIFICATE_MODAL";
export const DELETE_CERTIFICATE = "DELETE_CERTIFICATE";
export const LOAD_CERTIFICATE_ISSUERS_FULFILLED = "LOAD_CERTIFICATE_ISSUERS_FULFILLED";
export const LOAD_CERTIFICATE_ISSUERS_PENDING = "LOAD_CERTIFICATE_ISSUERS_PENDING";
export const LOAD_CERTIFICATE_ISSUERS_FAILED = "LOAD_CERTIFICATE_ISSUERS_FAILED";

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

export interface LoadCertificateIssuersPendingAction {
  type: typeof LOAD_CERTIFICATE_ISSUERS_PENDING;
}

export interface LoadCertificateIssuersFailedAction {
  type: typeof LOAD_CERTIFICATE_ISSUERS_FAILED;
}

export interface LoadCertificateIssuersAction {
  type: typeof LOAD_CERTIFICATE_ISSUERS_FULFILLED;
  payload: {
    certificateIssuers: Immutable.List<CertificateIssuer>;
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

export interface SetIsShowAddCertificateModal {
  type: typeof SET_IS_SHOW_ADD_CERTIFICATE_MODAL;
  payload: {
    isShowAddCertificateModal: boolean;
  };
}

export type CertificateList = Immutable.List<Certificate>;

export type CertificateIssuerList = Immutable.List<CertificateIssuer>;

export interface CertificateFormTypeContent extends CertificateContent {
  managedType: typeof selfManaged | typeof issuerManaged;
}

export const selfManaged = "selfManaged";
export const issuerManaged = "issuerManaged";

export type CertificateFormType = ImmutableMap<CertificateFormTypeContent>;

export type Certificate = ImmutableMap<CertificateContent>;

export type CertificateIssuer = ImmutableMap<CertificateIssuerContent>;

export const newEmptyCertificateForm = (): CertificateFormType => {
  return Immutable.fromJS({
    name: "",
    managedType: selfManaged,
    selfManagedCertContent: "",
    selfManagedCertPrivateKey: ""
  });
};

export interface CertificateContent {
  name: string;
  isSelfManaged: boolean;
  selfManagedCertContent: string;
  selfManagedCertPrivateKey: string;
  httpsCertIssuer: string;
  domains: Immutable.List<string>;
}

export interface CertificateIssuerContent {
  name: string;
}

export type CertificateActions =
  | LoadCertificatesPendingAction
  | LoadCertificatesFailedAction
  | LoadCertificatesAction
  | SetIsSubmittingCertificate
  | DeleteCertificate
  | SetIsShowAddCertificateModal
  | LoadCertificateIssuersPendingAction
  | LoadCertificateIssuersFailedAction
  | LoadCertificateIssuersAction;
