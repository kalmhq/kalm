import { LOAD_NODES_FAILED, LOAD_NODES_FULFILlED, LOAD_NODES_PENDING } from "types/node";
import { ThunkResult } from "../types";
import { api } from "api";

export const loadNodesAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_NODES_PENDING });
    try {
      const res = await api.getNodes();

      dispatch({
        type: LOAD_NODES_FULFILlED,
        payload: res,
      });
    } catch (e) {
      dispatch({ type: LOAD_NODES_FAILED });
      throw e;
    }
  };
};
