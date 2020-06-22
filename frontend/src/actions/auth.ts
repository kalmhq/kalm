import { getLoginStatus, validateToken } from "./kubernetesApi";
import { SomethingWrong, ThunkResult } from "../types";
import {
  LOAD_LOGIN_STATUS_FAILED,
  LOAD_LOGIN_STATUS_FULFILLED,
  LOAD_LOGIN_STATUS_PENDING,
  LOGOUT,
  LogoutAction,
  SET_AUTH_TOKEN,
} from "../types/common";
import { setErrorNotificationAction } from "./notification";
import { LoginStatus } from "types/authorization";

export const loadLoginStatus = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    let loginStatus: LoginStatus;

    dispatch({ type: LOAD_LOGIN_STATUS_PENDING });
    try {
      loginStatus = await getLoginStatus();
      dispatch({
        type: LOAD_LOGIN_STATUS_FULFILLED,
        payload: { loginStatus },
      });
    } catch (e) {
      dispatch(setErrorNotificationAction(SomethingWrong));
      dispatch({ type: LOAD_LOGIN_STATUS_FAILED });
    }
  };
};

export const validateTokenAction = (token: string): ThunkResult<Promise<boolean>> => {
  return async (dispatch) => {
    try {
      await validateToken(token);

      dispatch({
        type: SET_AUTH_TOKEN,
        payload: { token },
      });

      dispatch(loadLoginStatus());

      return true;
    } catch (e) {
      // 401 Unauthorized
      return false;
    }
  };
};

export const logoutAction = (): LogoutAction => {
  return {
    type: LOGOUT,
  };
};
