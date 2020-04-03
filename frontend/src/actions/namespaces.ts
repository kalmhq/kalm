import { Actions, StatusFailure, ThunkResult } from "../types";
import {
  CREATE_NAMESPACE_FULFILLED,
  CREATE_NAMESPACE_PENDING,
  LOAD_NAMESPACES_FAILED,
  LOAD_NAMESPACES_FULFILLED,
  LOAD_NAMESPACES_PENDING,
  SET_CURRENT_NAMESPACE
} from "../types/namespace";
import {
  createNamespace as createNamespaceApi,
  deleteNamespace as deleteNamespaceApi,
  getNamespaces
} from "./kubernetesApi";
import { setErrorNotificationAction } from "./notification";

export const loadNamespacesAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_NAMESPACES_PENDING });

    let namespaces;
    try {
      namespaces = await getNamespaces();
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

export const createNamespaceAction = (name: string): ThunkResult<Promise<boolean>> => {
  return async dispatch => {
    dispatch({
      type: CREATE_NAMESPACE_PENDING
    });

    try {
      await createNamespaceApi(name);

      // reload
      dispatch(loadNamespacesAction());
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

export const deleteNamespaceAction = (name: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    try {
      await deleteNamespaceApi(name);

      // reload
      dispatch(loadNamespacesAction());
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

export const setCurrentNamespaceAction = (namespace: string): Actions => {
  return {
    type: SET_CURRENT_NAMESPACE,
    payload: {
      namespace
    }
  };
};
