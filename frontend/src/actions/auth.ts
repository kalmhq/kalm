import { getLoginStatus, login } from "./kubernetesApi";
import { ThunkResult, SomethingWrong } from "../types";
import { INIT_AUTH, SET_AUTH_TOKEN } from "../types/common";
import { setErrorNotificationAction } from "./notification";

export const initAuthStatus = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    let authorized: boolean = false;
    try {
      authorized = await getLoginStatus();
    } catch (e) {
      dispatch(setErrorNotificationAction(SomethingWrong));
    }

    dispatch({
      type: INIT_AUTH,
      payload: { authorized }
    });
  };
};

export const loginAction = (token: string): ThunkResult<Promise<string | undefined>> => {
  return async dispatch => {
    let authorized;
    try {
      authorized = await login(token);
    } catch (e) {
      if (e.response && e.response.status === 401) {
        return "Auth token is invalid.";
      } else {
        dispatch(setErrorNotificationAction(SomethingWrong));
        return SomethingWrong;
      }
    }

    if (authorized) {
      dispatch({
        type: SET_AUTH_TOKEN,
        payload: { token }
      });
    } else {
      console.log(`login failed`);
    }

    return;
  };
};
