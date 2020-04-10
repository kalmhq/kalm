import { getLoginStatus, validateToken } from "./kubernetesApi";
import { ThunkResult, SomethingWrong } from "../types";
import { LOAD_LOGIN_STATUS, SET_AUTH_TOKEN } from "../types/common";
import { setErrorNotificationAction } from "./notification";
import { LoginStatus } from "types/authorization";

export const loadLoginStatus = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    let loginStatus: LoginStatus;

    try {
      loginStatus = await getLoginStatus();
      dispatch({
        type: LOAD_LOGIN_STATUS,
        payload: { loginStatus }
      });
    } catch (e) {
      dispatch(setErrorNotificationAction(SomethingWrong));
    }
  };
};

export const validateTokenAction = (token: string): ThunkResult<Promise<boolean>> => {
  return async dispatch => {
    try {
      await validateToken(token);

      dispatch({
        type: SET_AUTH_TOKEN,
        payload: { token }
      });

      dispatch(loadLoginStatus());

      return true;
    } catch (e) {
      // 401 Unauthorized
      return false;
    }
  };
};
