import produce from "immer";
import { Actions } from "types";
import {
  LOAD_LOGIN_STATUS_FAILED,
  LOAD_LOGIN_STATUS_FULFILLED,
  LOAD_LOGIN_STATUS_PENDING,
  LOGOUT,
  SET_AUTH_TOKEN,
} from "types/common";

type State = {
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
  };
};

// prevent LOGOUT reset token bug
const initialState: State = getInitialState();

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOAD_LOGIN_STATUS_FULFILLED: {
      state.authorized = action.payload.loginStatus.authorized;
      state.email = action.payload.loginStatus.email;
      state.policies = action.payload.loginStatus.policies;
      state.impersonation = action.payload.loginStatus.impersonation;
      state.groups = action.payload.loginStatus.groups;
      state.impersonationType = action.payload.loginStatus.impersonationType;
      state.avatarUrl = action.payload.loginStatus.avatarUrl;
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
  }

  return state;
}, initialState);

export default reducer;
