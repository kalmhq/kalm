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
  UPDATE_ROUTE_PENDING,
} from "types/route";
import { ThunkResult } from "../types";
import { createHttpRoute, deleteHttpRoute, getHttpRoutes, updateHttpRoute } from "./kubernetesApi";
import { setErrorNotificationAction } from "./notification";

export const loadRoutes = (namespace: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_ROUTES_PENDING });
    try {
      const routes = await getHttpRoutes(namespace);
      dispatch({
        type: LOAD_ROUTES_FULFILLED,
        payload: {
          httpRoutes: routes,
          namespace,
        },
      });
    } catch (e) {
      dispatch({ type: LOAD_ROUTES_FAILED });
      throw e;
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
          route: routeRes,
        },
      });
    } catch (e) {
      dispatch({ type: CREATE_ROUTE_FAILED });
      throw e;
    }
  };
};

export const updateRoute = (name: string, namespace: string, route: HttpRoute): ThunkResult<Promise<HttpRoute>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: UPDATE_ROUTE_PENDING });

      const routeRes = await updateHttpRoute(namespace, name, route);
      dispatch({
        type: UPDATE_ROUTE_FULFILLED,
        payload: {
          name,
          namespace,
          route: routeRes,
        },
      });

      return route;
    } catch (e) {
      dispatch({ type: UPDATE_ROUTE_FAILED });
      throw e;
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
          namespace,
        },
      });
    } catch (e) {
      dispatch({ type: DELETE_ROUTE_FAILED });
      throw e;
    }
  };
};
