import { getNodes } from "./kubernetesApi";
import { ThunkResult } from "../types";
import { LOAD_NODES } from "../types/common";

export const loadNodesAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const nodes = await getNodes();

    dispatch({
      type: LOAD_NODES,
      payload: { nodes }
    });
  };
};
