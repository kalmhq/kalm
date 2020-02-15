import { LOAD_NODES_ACTION, ThunkResult } from ".";
import { getNodes } from "./kubernetesApi";

export const loadNodesAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const nodes = await getNodes();

    dispatch({
      type: LOAD_NODES_ACTION,
      payload: { nodes }
    });
  };
};
