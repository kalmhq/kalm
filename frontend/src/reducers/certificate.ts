import Immutable from "immutable";
import { Actions } from "types";
import {
  Certificate,
  CertificateIssuerList,
  CertificateList,
  CREATE_CERTIFICATE,
  CREATE_CERTIFICATE_ISSUER,
  DELETE_CERTIFICATE,
  LOAD_CERTIFICATES_FAILED,
  LOAD_CERTIFICATES_FULFILLED,
  LOAD_CERTIFICATES_PENDING,
  LOAD_CERTIFICATE_ISSUERS_FULFILLED,
  SET_EDIT_CERTIFICATE_MODAL,
  SET_IS_SUBMITTING_CERTIFICATE,
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
  editingCertificate?: Certificate;
  certificates: CertificateList;
  certificateIssuers: CertificateIssuerList;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  isFirstLoaded: false,
  isSubmittingCreateCertificate: false,
  certificates: Immutable.List(),
  certificateIssuers: Immutable.List(),
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
    case LOAD_CERTIFICATE_ISSUERS_FULFILLED: {
      return state.set("certificateIssuers", action.payload.certificateIssuers || Immutable.List());
    }
    case SET_EDIT_CERTIFICATE_MODAL: {
      return state.set("editingCertificate", action.payload.certificate);
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
  }

  return state;
};

export default reducer;
