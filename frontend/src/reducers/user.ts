import Immutable from "immutable";
import { LOAD_USERS_FAILED, LOAD_USERS_FULFILLED, LOAD_USERS_PENDING, Users } from "types/user";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import { LOGOUT } from "types/common";

export type State = ImmutableMap<{
  isLoading: boolean;
  users: Users;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  users: Immutable.OrderedMap({}),
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_USERS_PENDING: {
      state = state.set("isLoading", true);
      break;
    }
    case LOAD_USERS_FAILED: {
      state = state.set("isLoading", false);
      break;
    }
    case LOAD_USERS_FULFILLED: {
      state = state.set("isLoading", false);
      state = state.set("users", action.payload.users);
      break;
    }
  }

  return state;
};

export default reducer;
