import {
  CREATE_ROUTE_FAILED,
  CREATE_ROUTE_FULFILLED,
  CREATE_ROUTE_PENDING,
  DELETE_ROUTE_FAILED,
  DELETE_ROUTE_FULFILLED,
  DELETE_ROUTE_PENDING,
  HttpRoute,
  LOAD_ROUTES_FAILED,
  UPDATE_ROUTE_FAILED,
  UPDATE_ROUTE_FULFILLED,
  UPDATE_ROUTE_PENDING
} from "types/route";
import { StatusFailure, ThunkResult } from "../types";
import { setErrorNotificationAction } from "./notification";

export const loadRoutes = (namespace: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    // dispatch({ type: LOAD_ROUTES_PENDING });
    try {
      //   const res: Immutable.List<HttpRoute> = Immutable.fromJS([
      //     {
      //       hosts: ["test.kapp.live", "test2.kapp.live"],
      //       paths: ["/", "/test"],
      //       conditions: [
      //         {
      //           type: "header",
      //           name: "test-user",
      //           operator: "equal",
      //           value: "123"
      //         },
      //         {
      //           type: "header",
      //           name: "test-user",
      //           operator: "notEqual",
      //           value: "123"
      //         },
      //         {
      //           type: "header",
      //           name: "test-user",
      //           operator: "prefix",
      //           value: "123"
      //         }
      //       ],
      //       destinations: [
      //         {
      //           host: "service-v2:80",
      //           weight: 50
      //         },
      //         {
      //           host: "service-v1:80",
      //           weight: 50
      //         }
      //       ],
      //       timeout: 5,
      //       retries: {
      //         attempts: 3,
      //         perTtyTimeoutSeconds: 2,
      //         retryOn: ["gateway-error", "connect-failure", "refused-stream"]
      //       },
      //       mirror: {
      //         percentage: 50,
      //         destination: {
      //           host: "service-v2:80",
      //           weight: 50
      //         }
      //       },
      //       fault: {
      //         percentage: 50,
      //         errorStatus: 500
      //       },
      //       delay: {
      //         percentage: 50,
      //         delaySeconds: 3
      //       },
      //       cors: {
      //         allowOrigin: ["*"],
      //         allowMethods: ["*"],
      //         allowCredentials: true,
      //         allowHeaders: [],
      //         maxAgeSeconds: 86400
      //       }
      //     }
      //   ]);
      //   dispatch({
      //     type: LOAD_ROUTES_FULFILLED,
      //     payload: {
      //       httpRoutes: res,
      //       namespace
      //     }
      //   });
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

      // TODO

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

      // TODO

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

      // TODO

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
