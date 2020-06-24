import Immutable from "immutable";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import {
  Certificate,
  CertificateIssuerList,
  CertificateList,
  CREATE_CERTIFICATE,
  CREATE_CERTIFICATE_ISSUER,
  DELETE_CERTIFICATE,
  LOAD_CERTIFICATE_ISSUERS_FULFILLED,
  LOAD_CERTIFICATES_FAILED,
  LOAD_CERTIFICATES_FULFILLED,
  LOAD_CERTIFICATES_PENDING,
  SET_EDIT_CERTIFICATE_MODAL,
  SET_IS_SUBMITTING_CERTIFICATE,
} from "types/certificate";

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
      const certificates = state.get("certificates");
      const index = certificates.findIndex((cert) => cert.get("name") === action.payload.name);

      if (index >= 0) {
        state = state.deleteIn(["certificates", index]);
      }

      break;
    }
    case CREATE_CERTIFICATE: {
      const index = state
        .get("certificates")
        .findIndex((certificate) => certificate.get("name") === action.payload.certificate.get("name"));
      if (index >= 0) {
        state = state.setIn(["certificates", index], action.payload.certificate);
      } else {
        state = state.update("certificates", (certificates) => certificates.push(action.payload.certificate));
      }
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
    case SET_IS_SUBMITTING_CERTIFICATE: {
      return state.set("isSubmittingCreateCertificate", action.payload.isSubmittingCertificate);
    }
  }

  return state;
};

export default reducer;
