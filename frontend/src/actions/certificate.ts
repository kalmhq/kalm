import { api } from "api";
import Immutable from "immutable";
import {
  Certificate,
  CertificateFormType,
  CertificateIssuer,
  CertificateIssuerFormType,
  CREATE_CERTIFICATE,
  CREATE_CERTIFICATE_ISSUER,
  DELETE_CERTIFICATE,
  LOAD_CERTIFICATE_ISSUERS_FULFILLED,
  LOAD_CERTIFICATE_ISSUERS_PENDING,
  LOAD_CERTIFICATES_FAILED,
  LOAD_CERTIFICATES_FULFILLED,
  LOAD_CERTIFICATES_PENDING,
  LOAD_ACME_SERVER_PENDING,
  LOAD_ACME_SERVER_FULFILLED,
  LOAD_ACME_SERVER_FAILED,
  CREATE_ACME_SERVER,
  DELETE_ACME_SERVER,
  SET_IS_SUBMITTING_ACME_SERVER,
  selfManaged,
  SET_IS_SUBMITTING_CERTIFICATE,
  SetIsSubmittingCertificate,
  AcmeServerInfo,
  AcmeServerFormType,
  SetIsSubmittingAcmeServer,
  dns01Mananged,
} from "types/certificate";
import { ThunkResult } from "types";

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
  certificateContent: CertificateFormType,
  isEdit?: boolean,
): ThunkResult<Promise<Certificate>> => {
  return async (dispatch) => {
    dispatch(setIsSubmittingCertificateAction(true));

    let certificate: Certificate;
    try {
      let certContent = certificateContent.set("isSelfManaged", certificateContent.get("managedType") === selfManaged);
      let hasWildcardDomains = false;
      const domains = certContent.get("domains").map((d) => {
        if (d.startsWith("*.")) {
          hasWildcardDomains = true;
        }
        return d.replace("*.", "");
      });
      if (hasWildcardDomains) {
        certContent = certContent.set("httpsCertIssuer", dns01Mananged);
        certContent = certContent.set("domains", domains);
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
  certificateIssuerContent: CertificateIssuerFormType,
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

export const createDefaultTestCertAction = async (dispatch: any) => {
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
        selfManagedCertPrivateKey: pk,
      }),
    ),
  );
};
