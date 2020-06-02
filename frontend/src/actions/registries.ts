import { LOAD_REGISTRIES_FAILED, LOAD_REGISTRIES_FULFILlED, LOAD_REGISTRIES_PENDING } from "types/registry";
import { ThunkResult } from "../types";
import { getRegistries } from "./kubernetesApi";

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
      dispatch({ type: LOAD_REGISTRIES_FAILED });
      throw e;
    }
  };
};
