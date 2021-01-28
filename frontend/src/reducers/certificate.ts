import { produce } from "immer";
import { Actions } from "types";
import {
  AcmeServerInfo,
  Certificate,
  CertificateIssuer,
  CREATE_CERTIFICATE,
  CREATE_CERTIFICATE_ISSUER,
  DELETE_CERTIFICATE,
  LOAD_ACME_SERVER_FAILED,
  LOAD_ACME_SERVER_FULFILLED,
  LOAD_ACME_SERVER_PENDING,
  LOAD_CERTIFICATES_FAILED,
  LOAD_CERTIFICATES_FULFILLED,
  LOAD_CERTIFICATES_PENDING,
  LOAD_CERTIFICATE_ISSUERS_FULFILLED,
} from "types/certificate";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_ACME_SERVER,
  RESOURCE_TYPE_HTTPS_CERT,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import { addOrUpdateInArray, isInArray, removeInArray, removeInArrayByName } from "./utils";

export interface State {
  isLoading: boolean;
  isFirstLoaded: boolean;
  certificates: Certificate[];
  certificateIssuers: CertificateIssuer[];
  isAcmeServerLoading: boolean;
  acmeServer: AcmeServerInfo | null;
}

const initialState: State = {
  isLoading: false,
  isFirstLoaded: false,
  certificates: [],
  certificateIssuers: [],
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
      state.acmeServer = action.payload.acmeServer;
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
      switch (action.kind) {
        case RESOURCE_TYPE_HTTPS_CERT: {
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
        case RESOURCE_TYPE_ACME_SERVER: {
          switch (action.payload.action) {
            case RESOURCE_ACTION_ADD: {
              state.acmeServer = action.payload.data;
              return;
            }
            case RESOURCE_ACTION_DELETE: {
              state.acmeServer = null;
              return;
            }
            case RESOURCE_ACTION_UPDATE: {
              state.acmeServer = action.payload.data;
              return;
            }
          }
          break;
        }
      }

      break;
    }
  }

  return;
}, initialState);

export default reducer;
