import { Actions } from "types";
import {
  CREATE_CERTIFICATE,
  CREATE_CERTIFICATE_ISSUER,
  DELETE_CERTIFICATE,
  LOAD_CERTIFICATES_FAILED,
  LOAD_CERTIFICATES_FULFILLED,
  LOAD_CERTIFICATES_PENDING,
  LOAD_CERTIFICATE_ISSUERS_FULFILLED,
  LOAD_ACME_SERVER_PENDING,
  LOAD_ACME_SERVER_FULFILLED,
  LOAD_ACME_SERVER_FAILED,
  SET_IS_SUBMITTING_CERTIFICATE,
  Certificate,
  CertificateIssuer,
  SET_IS_SUBMITTING_ACME_SERVER,
  AcmeServerInfo,
} from "types/certificate";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_TYPE_HTTPS_CERT,
  WATCHED_RESOURCE_CHANGE,
  RESOURCE_ACTION_UPDATE,
} from "types/resources";
import { produce } from "immer";
import { addOrUpdateInArray, removeInArrayByName, isInArray, removeInArray } from "./utils";

export interface State {
  isLoading: boolean;
  isFirstLoaded: boolean;
  isSubmittingCreateCertificate: boolean;
  certificates: Certificate[];
  certificateIssuers: CertificateIssuer[];
  isSubmittingCreateAcmeServer: boolean;
  isAcmeServerLoading: boolean;
  acmeServer: AcmeServerInfo | null;
}

const initialState: State = {
  isLoading: false,
  isFirstLoaded: false,
  isSubmittingCreateCertificate: false,
  certificates: [],
  certificateIssuers: [],
  isSubmittingCreateAcmeServer: false,
  isAcmeServerLoading: false,
  acmeServer: null,
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOAD_CERTIFICATES_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_CERTIFICATES_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_CERTIFICATES_FULFILLED: {
      state.isFirstLoaded = true;
      state.certificates = action.payload.certificates || [];
      return;
    }
    case LOAD_ACME_SERVER_PENDING: {
      state.isAcmeServerLoading = true;
      return;
    }
    case LOAD_ACME_SERVER_FAILED: {
      state.isAcmeServerLoading = false;
      return;
    }
    case LOAD_ACME_SERVER_FULFILLED: {
      state.isAcmeServerLoading = false;
      state.acmeServer = action.payload.acmeServer || null;
      break;
    }
    case LOAD_CERTIFICATE_ISSUERS_FULFILLED: {
      state.certificateIssuers = action.payload.certificateIssuers || [];
      return;
    }
    case DELETE_CERTIFICATE: {
      state.certificates = removeInArrayByName(state.certificates, action.payload.name);
      return;
    }
    case CREATE_CERTIFICATE: {
      state.certificates = addOrUpdateInArray(state.certificates, action.payload.certificate);
      return;
    }
    case CREATE_CERTIFICATE_ISSUER: {
      state.certificateIssuers = addOrUpdateInArray(state.certificateIssuers, action.payload.certificateIssuer);
      return;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_HTTPS_CERT) {
        return;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          if (!isInArray(state.certificates, action.payload.data)) {
            state.certificates = addOrUpdateInArray(state.certificates, action.payload.data);
          }
          return;
        }
        case RESOURCE_ACTION_DELETE: {
          state.certificates = removeInArray(state.certificates, action.payload.data);
          return;
        }
        case RESOURCE_ACTION_UPDATE: {
          state.certificates = addOrUpdateInArray(state.certificates, action.payload.data);
          return;
        }
      }
      break;
    }
    case SET_IS_SUBMITTING_CERTIFICATE: {
      state.isSubmittingCreateCertificate = action.payload.isSubmittingCertificate;
      return;
    }
    case SET_IS_SUBMITTING_ACME_SERVER: {
      state.isSubmittingCreateAcmeServer = action.payload.isSubmittingAcmeServer;
      return;
    }
  }

  return;
}, initialState);

export default reducer;
