import Immutable from "immutable";
import {
  LOAD_LOGIN_STATUS_FAILED,
  LOAD_LOGIN_STATUS_FULFILLED,
  LOAD_LOGIN_STATUS_PENDING,
  LOGOUT,
  SET_AUTH_TOKEN,
} from "types/common";
import { Actions } from "types";
import { ImmutableMap } from "typings";

export type State = ImmutableMap<{
  firstLoaded: boolean;
  isLoading: boolean;
  authorized: boolean;
  isAdmin: boolean;
  token: string;
  entity: string;
  csrf: string;
}>;

const AUTHORIZED_TOKEN_KEY = "AUTHORIZED_TOKEN_KEY";

const initialState: State = Immutable.Map({
  authorized: false,
  firstLoaded: false,
  isLoading: false,
  token: window.localStorage.getItem(AUTHORIZED_TOKEN_KEY) || "",
  entity: "",
  isAdmin: false,
  csrf: "",
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_LOGIN_STATUS_FULFILLED: {
      state = state.set("authorized", action.payload.loginStatus.get("authorized"));
      state = state.set("isAdmin", action.payload.loginStatus.get("isAdmin"));
      state = state.set("entity", action.payload.loginStatus.get("entity"));
      state = state.set("csrf", action.payload.loginStatus.get("csrf"));
      state = state.set("firstLoaded", true);
      state = state.set("isLoading", false);
      break;
    }
    case LOAD_LOGIN_STATUS_FAILED: {
      return state.set("isLoading", false);
    }
    case LOAD_LOGIN_STATUS_PENDING: {
      return state.set("isLoading", true);
    }
    case SET_AUTH_TOKEN: {
      state = state.set("token", action.payload.token);
      window.localStorage.setItem(AUTHORIZED_TOKEN_KEY, action.payload.token);
      break;
    }
    case LOGOUT: {
      window.localStorage.removeItem(AUTHORIZED_TOKEN_KEY);
      return initialState;
    }
  }

  return state;
};

export default reducer;
