import { api } from "api";
import { ThunkResult } from "types";
import {
  Certificate,
  CertificateIssuer,
  CREATE_CERTIFICATE,
  CREATE_CERTIFICATE_ISSUER,
  DELETE_CERTIFICATE,
  LOAD_CERTIFICATES_FAILED,
  LOAD_CERTIFICATES_FULFILLED,
  LOAD_CERTIFICATES_PENDING,
  LOAD_ACME_SERVER_PENDING,
  LOAD_ACME_SERVER_FULFILLED,
  LOAD_ACME_SERVER_FAILED,
  CREATE_ACME_SERVER,
  DELETE_ACME_SERVER,
  SET_IS_SUBMITTING_ACME_SERVER,
  LOAD_CERTIFICATE_ISSUERS_FULFILLED,
  LOAD_CERTIFICATE_ISSUERS_PENDING,
  selfManaged,
  SetIsSubmittingCertificate,
  AcmeServerInfo,
  AcmeServerFormType,
  SetIsSubmittingAcmeServer,
  dns01Mananged,
  SET_IS_SUBMITTING_CERTIFICATE,
  CertificateFormType,
  CertificateIssuerFormType,
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

export const createCertificateAction = (
  certificateForm: CertificateFormType,
  isEdit?: boolean,
): ThunkResult<Promise<Certificate>> => {
  return async (dispatch) => {
    dispatch(setIsSubmittingCertificateAction(true));

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
      dispatch(setIsSubmittingCertificateAction(false));
      throw e;
    }
    dispatch(setIsSubmittingCertificateAction(false));

    dispatch({ type: CREATE_CERTIFICATE, payload: { certificate } });
    return certificate;
  };
};

export const createCertificateIssuerAction = (
  certificateIssuerForm: CertificateIssuerFormType,
  isEdit?: boolean,
): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch(setIsSubmittingCertificateAction(true));

    let certificateIssuer: CertificateIssuer;
    try {
      certificateIssuer = await api.createCertificateIssuer(certificateIssuerForm, isEdit);
    } catch (e) {
      dispatch(setIsSubmittingCertificateAction(false));
      throw e;
    }
    dispatch(setIsSubmittingCertificateAction(false));

    dispatch({ type: CREATE_CERTIFICATE_ISSUER, payload: { certificateIssuer } });
  };
};

export const createAcmeServerAction = (acmeServerContent: AcmeServerFormType): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch(setIsSubmittingAcmeServer(true));

    let acmeServer: AcmeServerInfo;
    try {
      acmeServer = await api.createAcmeServer(acmeServerContent);
    } catch (e) {
      dispatch(setIsSubmittingAcmeServer(false));
      throw e;
    }
    dispatch(setIsSubmittingAcmeServer(false));

    dispatch({ type: CREATE_ACME_SERVER, payload: { acmeServer } });
  };
};

export const deleteAcmeServerAction = (acmeServerContent: AcmeServerFormType): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch(setIsSubmittingAcmeServer(true));

    try {
      await api.deleteAcmeServer(acmeServerContent);
    } catch (e) {
      dispatch(setIsSubmittingAcmeServer(false));
      throw e;
    }
    dispatch(setIsSubmittingAcmeServer(false));

    dispatch({ type: DELETE_ACME_SERVER, payload: { acmeServer: null } });
  };
};

export const editAcmeServerAction = (acmeServerContent: AcmeServerFormType): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch(setIsSubmittingAcmeServer(true));

    try {
      await api.editAcmeServer(acmeServerContent);
    } catch (e) {
      dispatch(setIsSubmittingAcmeServer(false));
      throw e;
    }
    dispatch(setIsSubmittingAcmeServer(false));

    dispatch(loadCertificateAcmeServerAction());
  };
};

export const setIsSubmittingCertificateAction = (isSubmittingCertificate: boolean): SetIsSubmittingCertificate => {
  return {
    type: SET_IS_SUBMITTING_CERTIFICATE,
    payload: {
      isSubmittingCertificate,
    },
  };
};

export const setIsSubmittingAcmeServer = (isSubmittingAcme: boolean): SetIsSubmittingAcmeServer => {
  return {
    type: SET_IS_SUBMITTING_ACME_SERVER,
    payload: {
      isSubmittingAcmeServer: isSubmittingAcme,
    },
  };
};
