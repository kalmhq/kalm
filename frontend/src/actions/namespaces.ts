import { ThunkResult, StatusFailure } from "../types";
import { LOAD_NAMESPACES, CREATE_NAMESPACE_PENDING, CREATE_NAMESPACE_FULFILLED } from "../types/namespace";
import {
  getNamespaces,
  createNamespace as createNamespaceApi,
  deleteNamespace as deleteNamespaceApi
} from "./kubernetesApi";
import { setErrorNotificationAction } from "./notification";

export const loadNamespaces = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const ns = await getNamespaces();

    dispatch({
      type: LOAD_NAMESPACES,
      payload: {
        namespaces: ns
      }
    });
  };
};

export const createNamespace = (name: string): ThunkResult<Promise<boolean>> => {
  return async dispatch => {
    dispatch({
      type: CREATE_NAMESPACE_PENDING
    });

    try {
      await createNamespaceApi(name);

      // reload
      dispatch(loadNamespaces());
      return true;
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return false;
    } finally {
      dispatch({
        type: CREATE_NAMESPACE_FULFILLED
      });
    }
  };
};

export const deleteNamespace = (name: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    try {
      await deleteNamespaceApi(name);

      // reload
      dispatch(loadNamespaces());
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }
  };
};
