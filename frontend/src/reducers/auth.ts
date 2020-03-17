import Immutable from "immutable";
import { INIT_AUTH, SET_AUTH_TOKEN } from "../actions";
import { Actions } from "../actions";
import { ImmutableMap } from "../typings";

export type State = ImmutableMap<{
  firstLoaded: boolean;
  authorized: boolean;
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
    case INIT_AUTH: {
      state = state.set("authorized", action.payload.authorized);
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
