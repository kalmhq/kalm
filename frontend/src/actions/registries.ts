import { LOAD_REGISTRIES_FAILED, LOAD_REGISTRIES_FULFILlED, LOAD_REGISTRIES_PENDING } from "types/registry";
import { StatusFailure, ThunkResult } from "../types";
import { getRegistries } from "./kubernetesApi";
import { setErrorNotificationAction } from "./notification";

export const loadRegistries = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_REGISTRIES_PENDING });
    try {
      const res = await getRegistries();

      dispatch({
        type: LOAD_REGISTRIES_FULFILlED,
        payload: res
      });
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: LOAD_REGISTRIES_FAILED });
    }
  };
};
