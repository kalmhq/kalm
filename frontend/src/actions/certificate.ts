import { api } from "api";
import { ThunkResult } from "types";
import {
  AcmeServerFormType,
  Certificate,
  CertificateFormType,
  CertificateIssuer,
  CertificateIssuerFormType,
  CREATE_CERTIFICATE,
  CREATE_CERTIFICATE_ISSUER,
  DELETE_ACME_SERVER,
  DELETE_CERTIFICATE,
  dns01Mananged,
  LOAD_ACME_SERVER_FAILED,
  LOAD_ACME_SERVER_FULFILLED,
  LOAD_ACME_SERVER_PENDING,
  LOAD_CERTIFICATES_FAILED,
  LOAD_CERTIFICATES_FULFILLED,
  LOAD_CERTIFICATES_PENDING,
  LOAD_CERTIFICATE_ISSUERS_FULFILLED,
  LOAD_CERTIFICATE_ISSUERS_PENDING,
  selfManaged,
} from "types/certificate";

export const deleteCertificateAction = (name: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    await api.deleteCertificate(name);

    dispatch({
      type: DELETE_CERTIFICATE,
      payload: { name },
    });
  };
};

export const loadCertificatesAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_CERTIFICATES_PENDING });
    try {
      const certificates = await api.getCertificateList();
      dispatch({
        type: LOAD_CERTIFICATES_FULFILLED,
        payload: {
          certificates,
        },
      });
    } catch (e) {
      dispatch({ type: LOAD_CERTIFICATES_FAILED });
      throw e;
    }
  };
};

export const loadCertificateIssuersAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_CERTIFICATE_ISSUERS_PENDING });
    try {
      const certificateIssuers = await api.getCertificateIssuerList();
      dispatch({
        type: LOAD_CERTIFICATE_ISSUERS_FULFILLED,
        payload: {
          certificateIssuers,
        },
      });
    } catch (e) {
      dispatch({ type: LOAD_CERTIFICATES_FAILED });
      throw e;
    }
  };
};

export const loadCertificateAcmeServerAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_ACME_SERVER_PENDING });
    try {
      const acmeServer = await api.getAcmeServer();
      dispatch({
        type: LOAD_ACME_SERVER_FULFILLED,
        payload: {
          acmeServer,
        },
      });
    } catch (e) {
      dispatch({ type: LOAD_ACME_SERVER_FAILED });
      throw e;
    }
  };
};

// TODO: refactor this shit !
export const createCertificateAction = (
  certificateForm: CertificateFormType,
  isEdit?: boolean,
): ThunkResult<Promise<Certificate>> => {
  return async (dispatch) => {
    let certificate: Certificate;
    try {
      certificateForm.isSelfManaged = certificateForm.managedType === selfManaged;
      let certContent = certificateForm;
      let hasWildcardDomains = false;
      const domains = certContent.domains.map((d) => {
        if (d.startsWith("*.")) {
          hasWildcardDomains = true;
        }
        return d;
      });

      if (hasWildcardDomains) {
        certContent.httpsCertIssuer = dns01Mananged;
        certContent.domains = domains;
      }

      certificate = await api.createCertificate(certContent, isEdit);
    } catch (e) {
      throw e;
    }

    dispatch({ type: CREATE_CERTIFICATE, payload: { certificate } });
    return certificate;
  };
};

export const createCertificateIssuerAction = (
  certificateIssuerForm: CertificateIssuerFormType,
  isEdit?: boolean,
): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    let certificateIssuer: CertificateIssuer;
    try {
      certificateIssuer = await api.createCertificateIssuer(certificateIssuerForm, isEdit);
    } catch (e) {
      throw e;
    }

    dispatch({ type: CREATE_CERTIFICATE_ISSUER, payload: { certificateIssuer } });
  };
};

export const deleteAcmeServerAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    try {
      await api.deleteAcmeServer();
    } catch (e) {
      throw e;
    }

    dispatch({ type: DELETE_ACME_SERVER, payload: { acmeServer: null } });
  };
};

export const setAcmeServerAction = (acmeServerContent: AcmeServerFormType): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    try {
      await api.setAcmeServer(acmeServerContent);
    } catch (e) {
      throw e;
    }

    dispatch(loadCertificateAcmeServerAction());
  };
};
