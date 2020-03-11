import { LOAD_NODES, ThunkResult } from ".";
import { getNodes } from "./kubernetesApi";

export const loadNodesAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const nodes = await getNodes();

    dispatch({
      type: LOAD_NODES,
      payload: { nodes }
    });
  };
};
