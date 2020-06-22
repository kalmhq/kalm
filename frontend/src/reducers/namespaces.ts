import Immutable from "immutable";
import { Actions } from "../types";
import { SET_CURRENT_NAMESPACE } from "../types/namespace";
import { ImmutableMap } from "../typings";
import queryString from "query-string";
import { LOGOUT } from "types/common";

export type State = ImmutableMap<{
  active: string;
}>;

const search = queryString.parse(window.location.search);
const LAST_SELECTED_NAMESPACE_CACHE_KEY = "LAST_SELECTED_NAMESPACE_CACHE_KEY";

const initialState: State = Immutable.Map({
  active: search.namespace || window.localStorage.getItem(LAST_SELECTED_NAMESPACE_CACHE_KEY) || "",
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case SET_CURRENT_NAMESPACE: {
      state = state.set("active", action.payload.namespace);
      window.localStorage.setItem(LAST_SELECTED_NAMESPACE_CACHE_KEY, action.payload.namespace);
      break;
    }
  }

  return state;
};

export default reducer;
