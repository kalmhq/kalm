import { ThunkResult } from "types";
import { LOAD_CLUSTER_INFO_FULFILlED, LOAD_CLUSTER_INFO_PENDING, LOAD_CLUSTER_INFO_FAILED } from "types/cluster";
import { getClusterInfo } from "./kubernetesApi";

export const loadClusterInfoAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_CLUSTER_INFO_PENDING });

    try {
      const info = await getClusterInfo();

      dispatch({
        type: LOAD_CLUSTER_INFO_FULFILlED,
        payload: info
      });
    } catch (e) {
      dispatch({ type: LOAD_CLUSTER_INFO_FAILED });
      throw e;
    }
  };
};
