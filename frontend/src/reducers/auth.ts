import Immutable from "immutable";
import { LOAD_LOGIN_STATUS, SET_AUTH_TOKEN } from "../types/common";
import { Actions } from "../types";
import { ImmutableMap } from "../typings";

export type State = ImmutableMap<{
  firstLoaded: boolean;
  authorized: boolean;
  isAdmin: boolean;
  token: string;
}>;

const AUTHORIZED_TOKEN_KEY = "AUTHORIZED_TOKEN_KEY";

const initialState: State = Immutable.Map({
  authorized: false,
  firstLoaded: false,
  token: window.localStorage.getItem(AUTHORIZED_TOKEN_KEY) || ""
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_LOGIN_STATUS: {
      state = state.set("authorized", action.payload.loginStatus.get("authorized"));
      state = state.set("isAdmin", action.payload.loginStatus.get("isAdmin"));
      state = state.set("firstLoaded", true);
      break;
    }
    case SET_AUTH_TOKEN: {
      state = state.set("authorized", true);
      state = state.set("firstLoaded", true);
      state = state.set("token", action.payload.token);
      window.localStorage.setItem(AUTHORIZED_TOKEN_KEY, action.payload.token);
      break;
    }
  }

  return state;
};

export default reducer;
