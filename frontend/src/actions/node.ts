import { getNodes } from "./kubernetesApi";
import { ThunkResult, StatusFailure } from "../types";
import { LOAD_NODES_PENDING, LOAD_NODES_FAILED, LOAD_NODES_FULFILlED } from "types/node";
import { setErrorNotificationAction } from "./notification";

export const loadNodesAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_NODES_PENDING });
    try {
      const nodes = await getNodes();

      dispatch({
        type: LOAD_NODES_FULFILlED,
        payload: { nodes }
      });
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: LOAD_NODES_FAILED });
    }
  };
};
