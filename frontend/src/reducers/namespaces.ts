import produce from "immer";
import queryString from "qs";
import { Actions } from "types";
import { LOGOUT } from "types/common";
import { SET_CURRENT_NAMESPACE } from "types/namespace";

type State = {
  active: string;
};

const search = queryString.parse(window.location.search.replace("?", ""));
const LAST_SELECTED_NAMESPACE_CACHE_KEY = "LAST_SELECTED_NAMESPACE_CACHE_KEY";

const initialState: State = {
  active:
    typeof search.namespace === "string"
      ? search.namespace
      : window.localStorage.getItem(LAST_SELECTED_NAMESPACE_CACHE_KEY) || "",
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case SET_CURRENT_NAMESPACE: {
      state.active = action.payload.namespace;
      window.localStorage.setItem(LAST_SELECTED_NAMESPACE_CACHE_KEY, action.payload.namespace);
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
