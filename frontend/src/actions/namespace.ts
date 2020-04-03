import { ThunkResult, StatusFailure } from "../types";
import { setErrorNotificationAction } from "./notification";
import {
  LOAD_NAMESPACES_PENDING,
  LOAD_NAMESPACES_FAILED,
  LOAD_NAMESPACES_FULFILLED,
  SET_CURRENT_NAMESPACE,
  SetCurrentNamespace
} from "../types/namespace";
import { getKappNamespaces } from "./kubernetesApi";

export const setCurrentNamespace = (namespace: string): SetCurrentNamespace => {
  return {
    type: SET_CURRENT_NAMESPACE,
    payload: {
      namespace
    }
  };
};

export const loadNamespacesAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_NAMESPACES_PENDING });

    let namespaces;
    try {
      namespaces = await getKappNamespaces();
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: LOAD_NAMESPACES_FAILED });
      return;
    }

    dispatch({
      type: LOAD_NAMESPACES_FULFILLED,
      payload: {
        namespaces
      }
    });
  };
};
