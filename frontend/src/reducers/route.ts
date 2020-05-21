import { ImmutableMap } from "../typings";
import { Actions } from "../types";
import Immutable from "immutable";
import { LOAD_ROUTES_FULLFILLED, LOAD_ROUTES_PENDING, LOAD_ROUTES_FAILED, HttpRoute } from "types/route";

export type State = ImmutableMap<{
  isLoading: boolean;
  isFirstLoaded: boolean;
  httpRoutes: Immutable.List<HttpRoute>;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  isFirstLoaded: false,
  httpRoutes: Immutable.List([])
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_ROUTES_PENDING: {
      return state.set("isLoading", true);
    }
    case LOAD_ROUTES_FAILED: {
      return state.set("isLoading", false);
    }
    case LOAD_ROUTES_FULLFILLED: {
      state = state.set("isLoading", false);
      state = state.set("isFirstLoaded", true);
      state = state.set("httpRoutes", action.payload.httpRoutes);
      break;
    }
  }

  return state;
};

export default reducer;
