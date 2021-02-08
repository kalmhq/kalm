import { api } from "api";
import { stopImpersonating } from "api/api";
import { ThunkResult } from "types";
import { LoginStatus } from "types/authorization";
import {
  LOAD_LOGIN_STATUS_FAILED,
  LOAD_LOGIN_STATUS_FULFILLED,
  LOAD_LOGIN_STATUS_PENDING,
  SET_AUTH_TOKEN,
} from "types/common";
import { setErrorNotificationAction } from "./notification";

export const loadLoginStatusAction = (showNotAuthError: boolean = true): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    let loginStatus: LoginStatus;

    dispatch({ type: LOAD_LOGIN_STATUS_PENDING });
    try {
      loginStatus = await api.getLoginStatus();
      dispatch({
        type: LOAD_LOGIN_STATUS_FULFILLED,
        payload: { loginStatus },
      });
    } catch (e) {
      if (!showNotAuthError && e.response && e.response.data.message === "not authorized") {
        console.error(e);
      } else {
        dispatch(setErrorNotificationAction(e.message));
      }
      dispatch({ type: LOAD_LOGIN_STATUS_FAILED });
    }
  };
};

export const validateTokenAction = (token: string): ThunkResult<Promise<string>> => {
  return async (dispatch) => {
    try {
      await api.validateToken(token);

      dispatch({
        type: SET_AUTH_TOKEN,
        payload: { token },
      });

      dispatch(loadLoginStatusAction());

      return "";
    } catch (e) {
      dispatch(setErrorNotificationAction(e.message));
      return e.message;
    }
  };
};

export const logoutAction = (): ThunkResult<Promise<void>> => {
  return async () => {
    try {
      stopImpersonating(false);
      const res = await api.oidcLogout();
      window.location.href = res.endSessionEndpoint;
    } catch (e) {
      console.log(e);
    }
  };
};
