import {
  LOAD_CERTIFICATES_FULFILLED,
  LOAD_CERTIFICATES_PENDING,
  LOAD_CERTIFICATES_FAILED,
  Certificate,
  SET_IS_SUBMITTING_CERTIFICATE,
  SetIsSubmittingCertificate
} from "types/certificate";
import { StatusFailure, ThunkResult } from "../types";
import { setErrorNotificationAction } from "./notification";
import { getCertificateList, createCertificate } from "./kubernetesApi";
import { resErrorsToSubmitErrors } from "utils";
import { SubmissionError } from "redux-form";
import Immutable from "immutable";

export const loadCertificates = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_CERTIFICATES_PENDING });
    try {
      const certificates = await getCertificateList();
      dispatch({
        type: LOAD_CERTIFICATES_FULFILLED,
        payload: {
          certificates
        }
      });
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: LOAD_CERTIFICATES_FAILED });
    }
  };
};

export const createCertificateAction = (certificateContent: Certificate): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch(setIsSubmittingCertificate(true));
    try {
      const certificate = await createCertificate(certificateContent);
    } catch (e) {
      console.log(e);
      if (e.response && e.response.data.errors && e.response.data.errors.length > 0) {
        const submitErrors = resErrorsToSubmitErrors(e.response.data.errors);
        throw new SubmissionError(submitErrors);
      } else if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    } finally {
      setTimeout(() => {
        dispatch(setIsSubmittingCertificate(false));
      }, 2000);
    }
  };
};

export const setIsSubmittingCertificate = (isSubmittingCertificate: boolean): SetIsSubmittingCertificate => {
  return {
    type: SET_IS_SUBMITTING_CERTIFICATE,
    payload: {
      isSubmittingCertificate
    }
  };
};

export const createDefaultTestCert = async (dispatch: any) => {
  const crt =
    "-----BEGIN CERTIFICATE-----\nMIICRTCCAa4CCQCU0lidoQAueDANBgkqhkiG9w0BAQUFADBnMQswCQYDVQQGEwJD\nTjENMAsGA1UECAwEZGRleDERMA8GA1UEBwwIU2hhbmdoYWkxETAPBgNVBAoMCFNo\nYW5naGFpMREwDwYDVQQLDAhTaGFuZ2hhaTEQMA4GA1UEAwwHZGRleC5pbzAeFw0y\nMDA1MjgwOTM4MTRaFw0zMDA1MjYwOTM4MTRaMGcxCzAJBgNVBAYTAkNOMQ0wCwYD\nVQQIDARkZGV4MREwDwYDVQQHDAhTaGFuZ2hhaTERMA8GA1UECgwIU2hhbmdoYWkx\nETAPBgNVBAsMCFNoYW5naGFpMRAwDgYDVQQDDAdkZGV4LmlvMIGfMA0GCSqGSIb3\nDQEBAQUAA4GNADCBiQKBgQCxl4X2ZDmh2DNzuu1uVQIS1h2ONCv5r2jWHmc3r/sY\nzm1v/C5sv03l5iZYjFfvYiIU/8SOnghOTL/7nJL6g3Ik/pgqXiTX5sgDyQ/rUX4m\nwZi97kR9xylT91znNJtbTq+01niMpsAkOQXYLLkrHfkBVIAkW3oGrVkNrrA8q7uW\n4QIDAQABMA0GCSqGSIb3DQEBBQUAA4GBADiZ4DbYiEKm6aNq/PlZ+8as78PK9LYq\nVYvubKyo6SYATa7l23uPhX1NQ8QOPsZhAO0Bf3Wm2sCQODAp2I8ph+etSihzkVyr\n6aDQ2XJFtTEUKxgNqIeAzyNAtoXSJDmprN5z/n1F/hQ1c+K/DiXVlIuoicm8XgCI\n6DxcpbsaZPLI\n-----END CERTIFICATE-----\n";
  const pk =
    "-----BEGIN RSA PRIVATE KEY-----\nMIICXQIBAAKBgQDZh0Q9OJDRpPMmThEFTXTAF6h5q0y1y9ozUGvprbIontKPsBTC\nL940MVVa9ELXsGbGxmcMarV2O9lvUF8kzp7OScZ14bPeVqHgd0vioO9B5mRfy5MH\nZgdlhKvPcsDENBnpWhmaSnzmJ4/LUq2CBK31JpwqCsjTdHtXAOrgjAQZmwIDAQAB\nAoGAe4QoRk8BRFlSS7TWS1mA6rZETtnq0+utuad3rxeW6yPL0hUcpGsD1EUS/3Nl\nJQ4gPcxYpR9ObJVtUJylecPtPY8qt9O7hMKPLt2fy7A2Y+CroW6DS61sEADAW/6W\npwRlNoGVmUiOPL0OemM/lfko0O0QY3M2Hc4kCvYmu5ZkgEkCQQD38KyxDU3YPISC\nfmzUVztMx5DiBmqSThxw3P8aiRK8qeDI4GvQobMiFzt7eCWkGYflVSegVKLWYxgL\nVC38RP9dAkEA4JmCZhY4HxqiFdikzjW/S6cSTRTChVCrNImDa6InQsEWFGP8Tdh+\nY56p0Z9j5eqI2wqsnqg300edv4Mwhx6FVwJAC+jXormM37Ioe0wvVhPKmWmMoA7G\n17hAzXsQFeo3qDBQx9Vf2Gmr/Rs4lDm1NSi0ymNIv/7Qw5OG+CRXASMfUQJBANIT\nY59++uFE9QRADe5+4T2uuHR2jXdKu8g5Mz5Sfix3E+LgnpZlf9pIBoj2b+cWVwmi\nU1FXAFhTbR47ZAGOL6MCQQCU2q8LsG4Mg5KtCC6/8m1hspe5yN4U7gkHb2b+lxnS\nbbxq3zk398ZrVAovunJWQ+Z4SHz5qO7P2djx0/nez5bg\n-----END RSA PRIVATE KEY-----\n";
  await dispatch(
    createCertificateAction(
      Immutable.Map({
        name: "ddex-1",
        isSelfManaged: true,
        selfManagedCertContent: crt,
        selfManagedCertPrivateKey: pk
      })
    )
  );
};
