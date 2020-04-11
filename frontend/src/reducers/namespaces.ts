import Immutable from "immutable";
import { Actions } from "../types";
import {
  CREATE_NAMESPACE_FULFILLED,
  CREATE_NAMESPACE_PENDING,
  LOAD_NAMESPACES_FAILED,
  LOAD_NAMESPACES_FULFILLED,
  LOAD_NAMESPACES_PENDING,
  Namespaces,
  SET_CURRENT_NAMESPACE
} from "../types/namespace";
import { ImmutableMap } from "../typings";
import queryString from "query-string";
import { LOGOUT } from "types/common";

export type State = ImmutableMap<{
  namespaces: Namespaces;
  active: string;
  isListLoading: boolean;
  isCreating: boolean;
  isFirstLoaded: boolean;
}>;

const search = queryString.parse(window.location.search);
const LAST_SELECTED_NAMESPACE_CACHE_KEY = "LAST_SELECTED_NAMESPACE_CACHE_KEY";

const initialState: State = Immutable.Map({
  namespaces: Immutable.List(),
  active: search.namespace || window.localStorage.getItem(LAST_SELECTED_NAMESPACE_CACHE_KEY) || "",
  isCreating: false,
  isListLoading: false,
  isFirstLoaded: false
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
    case LOAD_NAMESPACES_FULFILLED: {
      state = state.set("isListLoading", false);
      state = state.set("isFirstLoaded", true);
      return state.set("namespaces", action.payload.namespaces);
    }
    case CREATE_NAMESPACE_FULFILLED: {
      return state.set("isCreating", false);
    }
    case CREATE_NAMESPACE_PENDING: {
      return state.set("isCreating", true);
    }
    case LOAD_NAMESPACES_PENDING: {
      state = state.set("isListLoading", true);
      break;
    }
    case LOAD_NAMESPACES_FAILED: {
      state = state.set("isListLoading", false);
      break;
    }
  }

  return state;
};

export default reducer;
