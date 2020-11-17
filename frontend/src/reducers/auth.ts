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
  token: string;
  email: string;
  groups: string[];
  policies: string;
  avatarUrl: string;
  impersonation: string;
  impersonationType: string;
  permissionMethods: PermissionMethods;
  tenant: string;
  tenants: string[];
};

const AUTHORIZED_TOKEN_KEY = "AUTHORIZED_TOKEN_KEY";

const getInitialState = () => {
  return {
    authorized: false,
    firstLoaded: false,
    isLoading: false,
    token: window.localStorage.getItem(AUTHORIZED_TOKEN_KEY) || "",
    email: "",
    groups: [],
    policies: "",
    avatarUrl: "",
    impersonation: "",
    impersonationType: "",
    permissionMethods: emptyPermissionMethods,
    tenant: "",
    tenants: [],
  };
};

// prevent LOGOUT reset token bug
const initialState: State = getInitialState();

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOAD_LOGIN_STATUS_FULFILLED: {
      // FIXME: remove comments
      /*
      {"authorized":true,"avatarUrl":"https://www.gravatar.com/avatar/566f958c5360a8c81e2d6de15c84132a","email":"ialaddin@me.com","groups":[],"impersonation":"","impersonationType":"","policies":"","tenant":"","tenants":[]}
      */

      state.authorized = action.payload.loginStatus.authorized;
      state.email = action.payload.loginStatus.email;
      state.policies = action.payload.loginStatus.policies;
      state.impersonation = action.payload.loginStatus.impersonation;
      state.groups = action.payload.loginStatus.groups;
      state.impersonationType = action.payload.loginStatus.impersonationType;
      state.avatarUrl = action.payload.loginStatus.avatarUrl;
      state.tenant = action.payload.loginStatus.tenant; // "asia/aladdin-tenant"; //
      state.tenants = action.payload.loginStatus.tenants;
      // [
      //   "asia/aladdin-tenant",
      //   "asia/david-tenant",
      //   "asia/alan-tenant",
      //   "asia/gonghe-tenant",
      //   "euro/gonghe-euro-tenant",
      //   "global",
      // ]; //  ||
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
      return getInitialState();
    }
    case SET_AUTH_METHODS: {
      state.permissionMethods = action.payload;
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
