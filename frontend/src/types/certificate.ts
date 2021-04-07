export const LOAD_CERTIFICATES_FULFILLED = "LOAD_CERTIFICATES_FULFILLED";
export const LOAD_CERTIFICATES_PENDING = "LOAD_CERTIFICATES_PENDING";
export const LOAD_CERTIFICATES_FAILED = "LOAD_CERTIFICATES_FAILED";
export const DELETE_CERTIFICATE = "DELETE_CERTIFICATE";
export const LOAD_CERTIFICATE_ISSUERS_FULFILLED = "LOAD_CERTIFICATE_ISSUERS_FULFILLED";
export const LOAD_CERTIFICATE_ISSUERS_PENDING = "LOAD_CERTIFICATE_ISSUERS_PENDING";
const LOAD_CERTIFICATE_ISSUERS_FAILED = "LOAD_CERTIFICATE_ISSUERS_FAILED";
export const CREATE_CERTIFICATE = "CREATE_CERTIFICATE";
export const CREATE_CERTIFICATE_ISSUER = "CREATE_CERTIFICATE_ISSUER";
export const LOAD_ACME_SERVER_FULFILLED = "LOAD_ACME_SERVER_FULFILLED";
export const LOAD_ACME_SERVER_PENDING = "LOAD_ACME_SERVER_PENDING";
export const LOAD_ACME_SERVER_FAILED = "LOAD_ACME_SERVER_FAILED";
const CREATE_ACME_SERVER = "CREATE_ACME_SERVER";
export const DELETE_ACME_SERVER = "DELETE_ACME_SERVER";

interface CreateCertificateAction {
  type: typeof CREATE_CERTIFICATE;
  payload: {
    certificate: Certificate;
  };
}

interface CreateCertificateIssuerAction {
  type: typeof CREATE_CERTIFICATE_ISSUER;
  payload: {
    certificateIssuer: CertificateIssuer;
  };
}
interface EditAcmeServerAction {
  type: typeof CREATE_ACME_SERVER;
  payload: {
    acmeServer: AcmeServerInfo;
  };
}

interface DeleteAcmeServerAction {
  type: typeof DELETE_ACME_SERVER;
  payload: {
    acmeServer: null;
  };
}

interface LoadCertificatesPendingAction {
  type: typeof LOAD_CERTIFICATES_PENDING;
}

interface LoadCertificatesFailedAction {
  type: typeof LOAD_CERTIFICATES_FAILED;
}

interface LoadCertificatesAction {
  type: typeof LOAD_CERTIFICATES_FULFILLED;
  payload: {
    certificates: Certificate[];
  };
}

interface LoadAcmeServerPendingAction {
  type: typeof LOAD_ACME_SERVER_PENDING;
}

interface LoadAcmeServerFailedAction {
  type: typeof LOAD_ACME_SERVER_FAILED;
}

interface LoadAcmeServerAction {
  type: typeof LOAD_ACME_SERVER_FULFILLED;
  payload: {
    acmeServer: AcmeServerInfo | null;
  };
}

interface LoadCertificateIssuersPendingAction {
  type: typeof LOAD_CERTIFICATE_ISSUERS_PENDING;
}

interface LoadCertificateIssuersFailedAction {
  type: typeof LOAD_CERTIFICATE_ISSUERS_FAILED;
}

interface LoadCertificateIssuersAction {
  type: typeof LOAD_CERTIFICATE_ISSUERS_FULFILLED;
  payload: {
    certificateIssuers: CertificateIssuer[];
  };
}

interface DeleteCertificate {
  type: typeof DELETE_CERTIFICATE;
  payload: {
    name: string;
  };
}

export interface CertificateFormType extends Certificate {
  managedType: typeof selfManaged | typeof issuerManaged;
}

export interface CertificateIssuerFormType extends CertificateIssuer {
  issuerType: typeof cloudFlare | typeof caForTest;
}

export const dns01Mananged = "default-dns01-issuer";
export const issuerManaged = "issuerManaged";
export const selfManaged = "selfManaged";

const cloudFlare = "cloudFlare";
const caForTest = "caForTest";

// wildcard support httpsCertIssuser type
export const dns01Issuer = "default-dns01-issuer";
export const http01Issuer = "default-http01-issuer";

export const newEmptyCertificateForm: CertificateFormType = {
  name: "",
  managedType: issuerManaged,
  selfManagedCertContent: "",
  selfManagedCertPrivateKey: "",
  domains: [""],
  ready: "",
  reason: "",
};

export const newEmptyCertificateUploadForm: CertificateFormType = {
  name: "",
  managedType: selfManaged,
  selfManagedCertContent: "",
  selfManagedCertPrivateKey: "",
  domains: [],
};

export interface Certificate {
  name: string;
  isSelfManaged?: boolean;
  isSignedByTrustedCA?: boolean;
  expireTimestamp?: number;
  selfManagedCertContent: string;
  selfManagedCertPrivateKey: string;
  httpsCertIssuer?: string;
  domains: string[];
  ready?: "True" | ""; // why is a string??
  reason?: string;
  wildcardCertDNSChallengeDomainMap?: { [key: string]: string };
}

export interface CertificateIssuer {
  name: string;
  acmeCloudFlare?: AcmeCloudFlare;
  caForTest?: {};
}

interface AcmeCloudFlare {
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
  | DeleteCertificate
  | LoadCertificateIssuersPendingAction
  | LoadCertificateIssuersFailedAction
  | LoadCertificateIssuersAction
  | CreateCertificateAction
  | DeleteAcmeServerAction
  | EditAcmeServerAction
  | CreateCertificateIssuerAction;

export interface AcmeServerInfo {
  acmeDomain: string;
  nsDomain: string;
  ipForNameServer: string;
  hostnameForNameServer: string;
  ready: boolean;
}

export interface AcmeServerFormType {
  acmeDomain: string;
  nsDomain: string;
}
