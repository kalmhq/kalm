import Immutable from "immutable";
import { LOAD_REGISTRIES_FAILED, LOAD_REGISTRIES_FULFILlED, LOAD_REGISTRIES_PENDING } from "types/registry";
import { Actions } from "../types";
import { LOGOUT } from "../types/common";
import { ImmutableMap } from "../typings";

export type State = ImmutableMap<{
  isLoading: boolean;
  isFirstLoaded: boolean;
  registries: Immutable.List<RegistrationOptions>;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  isFirstLoaded: false,
  registries: Immutable.List([])
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_REGISTRIES_PENDING: {
      return state.set("isLoading", true);
    }
    case LOAD_REGISTRIES_FAILED: {
      return state.set("isLoading", false);
    }
    case LOAD_REGISTRIES_FULFILlED: {
      state = state.set("isLoading", false);
      state = state.set("isFirstLoaded", true);
      state = state.set("registries", action.payload);
      return state;
    }
  }

  return state;
};

export default reducer;
