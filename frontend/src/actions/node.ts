import { api } from "api";
import { ThunkResult } from "types";
import { LOAD_NODES_FAILED, LOAD_NODES_FULFILLED, LOAD_NODES_PENDING } from "types/node";

export const loadNodesAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_NODES_PENDING });
    try {
      const res = await api.getNodes();

      dispatch({
        type: LOAD_NODES_FULFILLED,
        payload: res,
      });
    } catch (e) {
      dispatch({ type: LOAD_NODES_FAILED });
      throw e;
    }
  };
};
