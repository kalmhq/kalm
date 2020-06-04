import {
  CREATE_ROUTE_FAILED,
  CREATE_ROUTE_FULFILLED,
  CREATE_ROUTE_PENDING,
  DELETE_ROUTE_FAILED,
  DELETE_ROUTE_FULFILLED,
  DELETE_ROUTE_PENDING,
  HttpRoute,
  LOAD_ROUTES_FAILED,
  LOAD_ROUTES_FULFILLED,
  LOAD_ROUTES_PENDING,
  UPDATE_ROUTE_FAILED,
  UPDATE_ROUTE_FULFILLED,
  UPDATE_ROUTE_PENDING
} from "types/route";
import { StatusFailure, ThunkResult } from "../types";
import { setErrorNotificationAction } from "./notification";
import { createHttpRoute, deleteHttpRoute, getHttpRoutes, updateHttpRoute } from "./kubernetesApi";

export const loadRoutes = (namespace: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_ROUTES_PENDING });
    try {
      const routes = await getHttpRoutes(namespace);
      dispatch({
        type: LOAD_ROUTES_FULFILLED,
        payload: {
          httpRoutes: routes,
          namespace
        }
      });
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: LOAD_ROUTES_FAILED });
    }
  };
};

export const createRoute = (name: string, namespace: string, route: HttpRoute): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: CREATE_ROUTE_PENDING });

      const routeRes = await createHttpRoute(namespace, route);
      dispatch({
        type: CREATE_ROUTE_FULFILLED,
        payload: {
          name,
          namespace,
          route: routeRes
        }
      });

      dispatch({
        type: CREATE_ROUTE_FULFILLED,
        payload: {
          name,
          namespace,
          route
        }
      });
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: CREATE_ROUTE_FAILED });
    }
  };
};

export const updateRoute = (name: string, namespace: string, route: HttpRoute): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: UPDATE_ROUTE_PENDING });

      const routeRes = await updateHttpRoute(namespace, name, route);
      dispatch({
        type: UPDATE_ROUTE_FULFILLED,
        payload: {
          name,
          namespace,
          route: routeRes
        }
      });

      dispatch({
        type: UPDATE_ROUTE_FULFILLED,
        payload: {
          name,
          namespace,
          route
        }
      });
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: UPDATE_ROUTE_FAILED });
    }
  };
};

export const deleteRoute = (name: string, namespace: string): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: DELETE_ROUTE_PENDING });

      const success = await deleteHttpRoute(namespace, name);

      if (!success) {
        dispatch(setErrorNotificationAction("Delete http route failed."));
        return;
      }

      dispatch({
        type: DELETE_ROUTE_FULFILLED,
        payload: {
          name,
          namespace
        }
      });

      dispatch({
        type: DELETE_ROUTE_FULFILLED,
        payload: {
          name,
          namespace
        }
      });
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: DELETE_ROUTE_FAILED });
    }
  };
};
