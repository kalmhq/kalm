import { ThunkResult } from "../types";
import { LOAD_DEPENDENCIES_FAILED, LOAD_DEPENDENCIES_FULFILLED, LOAD_DEPENDENCIES_PENDING } from "../types/dependency";
import { getDependencies } from "./kubernetesApi";

export const loadDependenciesAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_DEPENDENCIES_PENDING });

    let dependencies;
    try {
      dependencies = await getDependencies();
    } catch (e) {
      dispatch({ type: LOAD_DEPENDENCIES_FAILED });
      throw e;
    }

    dispatch({
      type: LOAD_DEPENDENCIES_FULFILLED,
      payload: {
        dependencies,
      },
    });
  };
};
