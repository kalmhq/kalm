import {
  emptyPermissionMethods,
  LOAD_LOGIN_STATUS_FAILED,
  LOAD_LOGIN_STATUS_FULFILLED,
  LOAD_LOGIN_STATUS_PENDING,
  LOGOUT,
  PermissionMethods,
  SET_AUTH_METHODS,
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
  policies: string; // casbin policies
  impersonation: string;
  permissionMethods: PermissionMethods;
};

const AUTHORIZED_TOKEN_KEY = "AUTHORIZED_TOKEN_KEY";

const initialState: State = {
  authorized: false,
  firstLoaded: false,
  isLoading: false,
  token: window.localStorage.getItem(AUTHORIZED_TOKEN_KEY) || "",
  entity: "",
  isAdmin: false,
  policies: "",
  impersonation: "",
  permissionMethods: emptyPermissionMethods,
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOAD_LOGIN_STATUS_FULFILLED: {
      state.authorized = action.payload.loginStatus.authorized;
      state.isAdmin = action.payload.loginStatus.isAdmin;
      state.entity = action.payload.loginStatus.entity;
      state.policies = action.payload.loginStatus.policies;
      state.impersonation = action.payload.loginStatus.impersonation;
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
      return initialState;
    }
    case SET_AUTH_METHODS: {
      state.permissionMethods = action.payload;
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
