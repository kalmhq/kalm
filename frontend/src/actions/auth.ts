import { getLoginStatus, login } from "./kubernetesApi";
import { ThunkResult, SomethingWrong } from "../types";
import { INIT_AUTH, SET_AUTH_TOKEN } from "../types/common";
import { setErrorNotificationAction } from "./notification";

export const initAuthStatus = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const authorized = await getLoginStatus();

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
      if (e.response.status === 401) {
        dispatch(setErrorNotificationAction("aaaaa"));
        return "Auth token is invalid.";
      } else if (e.response.status > 200) {
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
