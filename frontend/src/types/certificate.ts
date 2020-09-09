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

export interface LoadCertificatesPendingAction {
  type: typeof LOAD_CERTIFICATES_PENDING;
}

export interface LoadCertificatesFailedAction {
  type: typeof LOAD_CERTIFICATES_FAILED;
}

export interface LoadCertificatesAction {
  type: typeof LOAD_CERTIFICATES_FULFILLED;
  payload: {
    certificates: Certificate[];
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
    certificateIssuers: CertificateIssuer[];
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

export interface CertificateForm extends Certificate {
  managedType: typeof selfManaged | typeof issuerManaged;
}

export interface CertificateIssuerForm extends CertificateIssuer {
  issuerType: typeof cloudFlare | typeof caForTest;
}

export const selfManaged = "selfManaged";
export const issuerManaged = "issuerManaged";

export const cloudFlare = "cloudFlare";
export const caForTest = "caForTest";

export const newEmptyCertificateForm: CertificateForm = {
  name: "",
  managedType: issuerManaged,
  selfManagedCertContent: "",
  selfManagedCertPrivateKey: "",
  domains: [],
};

export const newEmptyCertificateIssuerForm = (): CertificateIssuerForm => {
  return {
    name: "",
    issuerType: cloudFlare,
  };
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
  ready?: string; // why is a string??
  reason?: string;
}

export interface CertificateIssuer {
  name: string;
  acmeCloudFlare?: AcmeCloudFlare;
  caForTest?: {};
}

export interface AcmeCloudFlare {
  account: string;
  secret: string;
}

export type CertificateActions =
  | LoadCertificatesPendingAction
  | LoadCertificatesFailedAction
  | LoadCertificatesAction
  | SetIsSubmittingCertificate
  | DeleteCertificate
  | LoadCertificateIssuersPendingAction
  | LoadCertificateIssuersFailedAction
  | LoadCertificateIssuersAction
  | CreateCertificateAction
  | CreateCertificateIssuerAction;
