import Immutable from "immutable";
import { ImmutableMap } from "typings";

export const LOAD_CERTIFICATES_FULFILLED = "LOAD_CERTIFICATES_FULFILLED";
export const LOAD_CERTIFICATES_PENDING = "LOAD_CERTIFICATES_PENDING";
export const LOAD_CERTIFICATES_FAILED = "LOAD_CERTIFICATES_FAILED";
export const SET_IS_SUBMITTING_CERTIFICATE = "SET_IS_SUBMITTING_CERTIFICATE";
export const DELETE_CERTIFICATE = "DELETE_CERTIFICATE";
export const LOAD_CERTIFICATE_ISSUERS_FULFILLED = "LOAD_CERTIFICATE_ISSUERS_FULFILLED";
export const LOAD_CERTIFICATE_ISSUERS_PENDING = "LOAD_CERTIFICATE_ISSUERS_PENDING";
export const LOAD_CERTIFICATE_ISSUERS_FAILED = "LOAD_CERTIFICATE_ISSUERS_FAILED";
export const CREATE_CERTIFICATE = "CREATE_CERTIFICATE";
export const CREATE_CERTIFICATE_ISSUER = "CREATE_CERTIFICATE_ISSUER";
export const LOAD_ACME_SERVER_FULFILLED = "LOAD_ACME_SERVER_FULFILLED";
export const LOAD_ACME_SERVER_PENDING = "LOAD_ACME_SERVER_PENDING";
export const LOAD_ACME_SERVER_FAILED = "LOAD_ACME_SERVER_FAILED";
export const SET_IS_SUBMITTING_ACME_SERVER = "SET_IS_SUBMITTING_ACME_SERVER";
export const CREATE_ACME_SERVER = "CREATE_ACME_SERVER";

export interface CreateCertificateAction {
  type: typeof CREATE_CERTIFICATE;
  payload: {
    certificate: Certificate;
  };
}

export interface CreateCertificateIssuerAction {
  type: typeof CREATE_CERTIFICATE_ISSUER;
  payload: {
    certificateIssuer: CertificateIssuer;
  };
}

export interface CreateAcmeServerAction {
  type: typeof CREATE_ACME_SERVER;
  payload: {
    acmeServer: AcmeServerInfo;
  };
}

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

export interface LoadAcmeServerPendingAction {
  type: typeof LOAD_ACME_SERVER_PENDING;
}

export interface LoadAcmeServerFailedAction {
  type: typeof LOAD_ACME_SERVER_FAILED;
}

export interface LoadAcmeServerAction {
  type: typeof LOAD_ACME_SERVER_FULFILLED;
  payload: {
    acmeServer: AcmeServerInfo;
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

export interface SetIsSubmittingAcmeServer {
  type: typeof SET_IS_SUBMITTING_ACME_SERVER;
  payload: {
    isSubmittingAcmeServer: boolean;
  };
}

export interface DeleteCertificate {
  type: typeof DELETE_CERTIFICATE;
  payload: {
    name: string;
  };
}

export type CertificateList = Immutable.List<Certificate>;

export type CertificateIssuerList = Immutable.List<CertificateIssuer>;

export interface CertificateFormTypeContent extends CertificateContent {
  managedType: typeof selfManaged | typeof issuerManaged;
}

export interface CertificateIssuerFormTypeContent extends CertificateIssuerContent {
  issuerType: typeof cloudFlare | typeof caForTest;
}

export const selfManaged = "selfManaged";
export const issuerManaged = "issuerManaged";

export const cloudFlare = "cloudFlare";
export const caForTest = "caForTest";

// wildcard support httpsCertIssuser type
export const dns01Issuer = "default-dns01-issuer";

export type CertificateFormType = ImmutableMap<CertificateFormTypeContent>;

export type CertificateIssuerFormType = ImmutableMap<CertificateIssuerFormTypeContent>;

export type Certificate = ImmutableMap<CertificateContent>;

export type CertificateIssuer = ImmutableMap<CertificateIssuerContent>;

export const newEmptyCertificateForm: CertificateFormType = Immutable.fromJS({
  name: "",
  managedType: issuerManaged,
  selfManagedCertContent: "",
  selfManagedCertPrivateKey: "",
  domains: Immutable.List(),
});

export const newEmptyCertificateUploadForm: CertificateFormType = Immutable.fromJS({
  name: "",
  managedType: selfManaged,
  selfManagedCertContent: "",
  selfManagedCertPrivateKey: "",
  domains: Immutable.List(),
});

export const newEmptyCertificateIssuerForm = (): CertificateIssuerFormType => {
  return Immutable.fromJS({
    name: "",
    issuerType: cloudFlare,
  });
};

export interface CertificateContent {
  name: string;
  isSelfManaged: boolean;
  isSignedByTrustedCA: boolean;
  expireTimestamp: number;
  selfManagedCertContent: string;
  selfManagedCertPrivateKey: string;
  httpsCertIssuer: string;
  domains: Immutable.List<string>;
  ready: string; // why is a string??
  reason: string;
  wildcardCertDNSChallengeDomain?: string;
}

export interface CertificateIssuerContent {
  name: string;
  acmeCloudFlare?: AcmeCloudFlare;
  caForTest?: ImmutableMap<{}>;
}

export type AcmeCloudFlare = ImmutableMap<AcmeCloudFlareContent>;

export interface AcmeCloudFlareContent {
  account: string;
  secret: string;
}

export type CertificateActions =
  | LoadCertificatesPendingAction
  | LoadCertificatesFailedAction
  | LoadCertificatesAction
  | LoadAcmeServerPendingAction
  | LoadAcmeServerFailedAction
  | LoadAcmeServerAction
  | SetIsSubmittingAcmeServer
  | SetIsSubmittingCertificate
  | DeleteCertificate
  | LoadCertificateIssuersPendingAction
  | LoadCertificateIssuersFailedAction
  | LoadCertificateIssuersAction
  | CreateCertificateAction
  | CreateAcmeServerAction
  | CreateCertificateIssuerAction;

export interface AcmeServerInfoContent {
  acmeDomain: string;
  nsDomain: string;
  ipForNameServer: string;
  ready: boolean;
}
export type AcmeServerInfo = ImmutableMap<AcmeServerInfoContent>;

export interface AcmeServerFormTypeContent {
  acmeDomain: string;
  nsDomain: string;
}

export type AcmeServerFormType = ImmutableMap<AcmeServerFormTypeContent>;
