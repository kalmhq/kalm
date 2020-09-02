import { api } from "api";
import { ThunkResult } from "types";
import {
  Certificate,
  CertificateFormTypeContent,
  CertificateIssuer,
  CREATE_CERTIFICATE,
  CREATE_CERTIFICATE_ISSUER,
  DELETE_CERTIFICATE,
  LOAD_CERTIFICATES_FAILED,
  LOAD_CERTIFICATES_FULFILLED,
  LOAD_CERTIFICATES_PENDING,
  LOAD_CERTIFICATE_ISSUERS_FULFILLED,
  LOAD_CERTIFICATE_ISSUERS_PENDING,
  selfManaged,
  SetIsSubmittingCertificate,
  SET_IS_SUBMITTING_CERTIFICATE,
  CertificateIssuerFormTypeContent,
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

export const createCertificateAction = (
  certificateContent: CertificateFormTypeContent,
  isEdit?: boolean,
): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch(setIsSubmittingCertificateAction(true));

    let certificate: Certificate;
    certificateContent.isSelfManaged = certificateContent.managedType === selfManaged;
    try {
      certificate = await api.createCertificate(certificateContent, isEdit);
    } catch (e) {
      dispatch(setIsSubmittingCertificateAction(false));
      throw e;
    }
    dispatch(setIsSubmittingCertificateAction(false));

    dispatch({ type: CREATE_CERTIFICATE, payload: { certificate } });
  };
};

export const createCertificateIssuerAction = (
  certificateIssuerContent: CertificateIssuerFormTypeContent,
  isEdit?: boolean,
): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch(setIsSubmittingCertificateAction(true));

    let certificateIssuer: CertificateIssuer;
    try {
      certificateIssuer = await api.createCertificateIssuer(certificateIssuerContent, isEdit);
    } catch (e) {
      dispatch(setIsSubmittingCertificateAction(false));
      throw e;
    }
    dispatch(setIsSubmittingCertificateAction(false));

    dispatch({ type: CREATE_CERTIFICATE_ISSUER, payload: { certificateIssuer } });
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
