import Immutable from "immutable";
import { Actions } from "../types";
import { ImmutableMap } from "../typings";
import {
  LOAD_CERTIFICATES_FAILED,
  LOAD_CERTIFICATES_PENDING,
  CertificateList,
  SET_IS_SUBMITTING_CERTIFICATE,
  LOAD_CERTIFICATES_FULFILLED,
  DELETE_CERTIFICATE,
  SET_IS_SHOW_ADD_CERTIFICATE_MODAL
} from "types/certificate";

export type State = ImmutableMap<{
  isLoading: boolean;
  isFirstLoaded: boolean;
  isSubmittingCreateCertificate: boolean;
  isShowAddCertificateModal: boolean;
  certificates: CertificateList;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  isFirstLoaded: false,
  isSubmittingCreateCertificate: false,
  isShowAddCertificateModal: false,
  certificates: Immutable.List()
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
    case SET_IS_SHOW_ADD_CERTIFICATE_MODAL: {
      return state.set("isShowAddCertificateModal", action.payload.isShowAddCertificateModal);
    }
    case DELETE_CERTIFICATE: {
      const certificates = state.get("certificates");
      const index = certificates.findIndex(cert => cert.get("name") === action.payload.name);

      if (index >= 0) {
        state = state.deleteIn(["certificates", index]);
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
