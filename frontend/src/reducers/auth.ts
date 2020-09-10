import {
  LOAD_LOGIN_STATUS_FAILED,
  LOAD_LOGIN_STATUS_FULFILLED,
  LOAD_LOGIN_STATUS_PENDING,
  LOGOUT,
  SET_AUTH_TOKEN,
} from "types/common";
import { Actions } from "types";
import produce from "immer";

export type State = {
  firstLoaded: boolean;
  isLoading: boolean;
  authorized: boolean;
  isAdmin: boolean;
  token: string;
  entity: string;
  csrf: string;
};

const AUTHORIZED_TOKEN_KEY = "AUTHORIZED_TOKEN_KEY";

const initialState: State = {
  authorized: false,
  firstLoaded: false,
  isLoading: false,
  token: window.localStorage.getItem(AUTHORIZED_TOKEN_KEY) || "",
  entity: "",
  isAdmin: false,
  csrf: "",
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOAD_LOGIN_STATUS_FULFILLED: {
      state.authorized = action.payload.loginStatus.authorized;
      state.isAdmin = action.payload.loginStatus.isAdmin;
      state.entity = action.payload.loginStatus.entity;
      state.csrf = action.payload.loginStatus.csrf;
      state.firstLoaded = true;
      state.isLoading = false;
      return;
    }
    case LOAD_LOGIN_STATUS_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_LOGIN_STATUS_PENDING: {
      state.isLoading = true;
      return;
    }
    case SET_AUTH_TOKEN: {
      state.token = action.payload.token;
      window.localStorage.setItem(AUTHORIZED_TOKEN_KEY, action.payload.token);
      return;
    }
    case LOGOUT: {
      window.localStorage.removeItem(AUTHORIZED_TOKEN_KEY);
      state = initialState;
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
