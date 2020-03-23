import { getLoginStatus, login } from "./kubernetesApi";
import { ThunkResult } from "../types";
import { INIT_AUTH, SET_AUTH_TOKEN } from "../types/common";

export const initAuthStatus = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const authorized = await getLoginStatus();

    dispatch({
      type: INIT_AUTH,
      payload: { authorized }
    });
  };
};

export const loginAction = (token: string): ThunkResult<Promise<boolean>> => {
  return async dispatch => {
    let authorized = false;

    try {
      authorized = await login(token);
    } catch (e) {
      console.log(e);
    }

    if (authorized) {
      dispatch({
        type: SET_AUTH_TOKEN,
        payload: { token }
      });
    } else {
      console.log(`login failed`);
    }

    return authorized;
  };
};
