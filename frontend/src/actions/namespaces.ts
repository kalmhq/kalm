import { push } from "connected-react-router";
import queryString from "query-string";
import { StatusFailure, ThunkResult } from "../types";
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

    try {
      const namespaces = await getNamespaces();

      dispatch({
        type: LOAD_NAMESPACES_FULFILLED,
        payload: {
          namespaces
        }
      });
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: LOAD_NAMESPACES_FAILED });
      return;
    }
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

export const setCurrentNamespaceAction = (namespace: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const query = queryString.stringify({ ...queryString.parse(window.location.search), namespace });
    dispatch(push(window.location.pathname + "?" + query + window.location.hash));

    dispatch({
      type: SET_CURRENT_NAMESPACE,
      payload: {
        namespace
      }
    });
  };
};
