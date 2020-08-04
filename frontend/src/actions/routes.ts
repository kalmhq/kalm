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
import { ThunkResult } from "types";
import { setErrorNotificationAction } from "./notification";
import { api } from "api";

export const loadRoutesAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_ROUTES_PENDING });
    try {
      const routes = await api.getHttpRoutes();
      dispatch({
        type: LOAD_ROUTES_FULFILLED,
        payload: {
          httpRoutes: routes,
        },
      });
    } catch (e) {
      dispatch({ type: LOAD_ROUTES_FAILED });
      throw e;
    }
  };
};

export const createRouteAction = (route: HttpRoute): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: CREATE_ROUTE_PENDING });

      const routeRes = await api.createHttpRoute(route);
      dispatch({
        type: CREATE_ROUTE_FULFILLED,
        payload: {
          route: routeRes,
        },
      });
    } catch (e) {
      dispatch({ type: CREATE_ROUTE_FAILED });
      throw e;
    }
  };
};

export const updateRouteAction = (route: HttpRoute): ThunkResult<Promise<HttpRoute>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: UPDATE_ROUTE_PENDING });

      const routeRes = await api.updateHttpRoute(route);
      dispatch({
        type: UPDATE_ROUTE_FULFILLED,
        payload: {
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

export const deleteRouteAction = (route: HttpRoute): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: DELETE_ROUTE_PENDING });

      const success = await api.deleteHttpRoute(route);

      if (!success) {
        dispatch(setErrorNotificationAction("Delete http route failed."));
        return;
      }

      dispatch({
        type: DELETE_ROUTE_FULFILLED,
        payload: {
          route,
        },
      });
    } catch (e) {
      dispatch({ type: DELETE_ROUTE_FAILED });
      throw e;
    }
  };
};
