import Immutable from "immutable";
import { Actions } from "types";
import {
  CertificateIssuerList,
  CertificateList,
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
import { ImmutableMap } from "typings";
import { addOrUpdateInList, removeInList, removeInListByName, isInList } from "./utils";

export type State = ImmutableMap<{
  isLoading: boolean;
  isFirstLoaded: boolean;
  isSubmittingCreateCertificate: boolean;
  isSubmittingCreateAcmeServer: boolean;
  isAcmeServerLoading: boolean;
  certificates: CertificateList;
  certificateIssuers: CertificateIssuerList;
  acmeServer: AcmeServerInfo | null;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  isFirstLoaded: false,
  isSubmittingCreateCertificate: false,
  isSubmittingCreateAcmeServer: false,
  isAcmeServerLoading: false,
  certificates: Immutable.List(),
  certificateIssuers: Immutable.List(),
  acmeServer: null,
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_CERTIFICATES_PENDING: {
      return state.set("isLoading", true);
    }
    case LOAD_CERTIFICATES_FAILED: {
      return state.set("isLoading", false);
    }
    case LOAD_CERTIFICATES_FULFILLED: {
      state = state.set("isFirstLoaded", true);
      state = state.set("certificates", action.payload.certificates || Immutable.List());
      break;
    }
    case LOAD_ACME_SERVER_PENDING: {
      return state.set("isAcmeServerLoading", true);
    }
    case LOAD_ACME_SERVER_FAILED: {
      return state.set("isAcmeServerLoading", false);
    }
    case LOAD_ACME_SERVER_FULFILLED: {
      state = state.set("isAcmeServerLoading", false);
      state = state.set("acmeServer", action.payload.acmeServer || null);
      break;
    }
    case LOAD_CERTIFICATE_ISSUERS_FULFILLED: {
      return state.set("certificateIssuers", action.payload.certificateIssuers || Immutable.List());
    }
    case DELETE_CERTIFICATE: {
      state = state.update("certificates", (x) => removeInListByName(x, action.payload.name));
      break;
    }
    case CREATE_CERTIFICATE: {
      state = state.update("certificates", (x) => addOrUpdateInList(x, action.payload.certificate));

      break;
    }
    case CREATE_CERTIFICATE_ISSUER: {
      const index = state
        .get("certificateIssuers")
        .findIndex(
          (certificateIssuer) => certificateIssuer.get("name") === action.payload.certificateIssuer.get("name"),
        );
      if (index >= 0) {
        state = state.setIn(["certificateIssuers", index], action.payload.certificateIssuer);
      } else {
        state = state.update("certificateIssuers", (certificateIssuers) =>
          certificateIssuers.push(action.payload.certificateIssuer),
        );
      }
      break;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_HTTPS_CERT) {
        return state;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          if (!isInList(state.get("certificates"), action.payload.data)) {
            state = state.update("certificates", (x) => addOrUpdateInList(x, action.payload.data));
          }
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state = state.update("certificates", (x) => removeInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state = state.update("certificates", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
      }

      break;
    }
    case SET_IS_SUBMITTING_CERTIFICATE: {
      return state.set("isSubmittingCreateCertificate", action.payload.isSubmittingCertificate);
    }
    case SET_IS_SUBMITTING_ACME_SERVER: {
      return state.set("isSubmittingCreateAcmeServer", action.payload.isSubmittingAcmeServer);
    }
  }

  return state;
};

export default reducer;
