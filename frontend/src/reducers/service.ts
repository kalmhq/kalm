import Immutable from "immutable";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import { LOAD_SERVICES_FAILED, LOAD_SERVICES_FULFILLED, LOAD_SERVICES_PENDING, Service } from "types/service";

export type State = ImmutableMap<{
  isLoading: boolean;
  isFirstLoaded: boolean;
  services: Immutable.List<Service>;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  isFirstLoaded: false,
  services: Immutable.List([]),
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_SERVICES_PENDING: {
      return state.set("isLoading", true);
    }
    case LOAD_SERVICES_FAILED: {
      return state.set("isLoading", false);
    }
    case LOAD_SERVICES_FULFILLED: {
      state = state.set("isLoading", false);
      state = state.set("isFirstLoaded", true);
      state = state.set("services", action.payload.services);
      break;
    }
  }

  return state;
};

export default reducer;
