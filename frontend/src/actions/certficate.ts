import { LOAD_CERTFICATES_FULFILLED, LOAD_CERTFICATES_PENDING, LOAD_CERTFICATES_FAILED } from "types/certficate";
import { StatusFailure, ThunkResult } from "../types";
import { setErrorNotificationAction } from "./notification";
import { getCertficateList } from "./kubernetesApi";

export const loadCertficates = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_CERTFICATES_PENDING });
    try {
      const res = await getCertficateList();
      debugger;
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: LOAD_CERTFICATES_FAILED });
    }
  };
};
