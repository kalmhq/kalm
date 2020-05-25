import Immutable from "immutable";
import { HttpRoute, LOAD_ROUTES_FAILED, LOAD_ROUTES_FULLFILLED, LOAD_ROUTES_PENDING } from "types/route";
import { StatusFailure, ThunkResult } from "../types";
import { setErrorNotificationAction } from "./notification";

export const loadRoutes = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_ROUTES_PENDING });
    try {
      const res: Immutable.List<HttpRoute> = Immutable.fromJS([
        {
          hosts: ["test.kapp.live", "test2.kapp.live"],
          paths: ["/", "/test"],
          conditions: [
            {
              type: "header",
              name: "test-user",
              operator: "equal",
              value: "123"
            },
            {
              type: "header",
              name: "test-user",
              operator: "notEqual",
              value: "123"
            },
            {
              type: "header",
              name: "test-user",
              operator: "prefix",
              value: "123"
            }
          ],
          destinations: [
            {
              host: "service-v2:80",
              weight: 50
            },
            {
              host: "service-v1:80",
              weight: 50
            }
          ],
          timeout: 5,
          retries: {
            attempts: 3,
            perTtyTimeoutSeconds: 2,
            retryOn: ["gateway-error", "connect-failure", "refused-stream"]
          },
          mirror: {
            percentage: 50,
            destination: {
              host: "service-v2:80",
              weight: 50
            }
          },
          fault: {
            percentage: 50,
            errorStatus: 500
          },
          delay: {
            percentage: 50,
            delaySeconds: 3
          },
          cors: {
            allowOrigin: ["*"],
            allowMethods: ["*"],
            allowCredentials: true,
            allowHeaders: [],
            maxAgeSeconds: 86400
          }
        }
      ]);

      dispatch({
        type: LOAD_ROUTES_FULLFILLED,
        payload: {
          httpRoutes: res
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
