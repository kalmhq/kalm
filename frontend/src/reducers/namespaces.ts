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

export type State = ImmutableMap<{
  namespaces: Namespaces;
  active: string;
  isListLoading: boolean;
  isCreating: boolean;
  isFirstLoaded: boolean;
}>;

const KAPP_CURRENT_NAMESPACE_KEY = "KAPP_CURRENT_NAMESPACE_KEY";

const initialState: State = Immutable.Map({
  namespaces: Immutable.List(),
  active: window.localStorage.getItem(KAPP_CURRENT_NAMESPACE_KEY) || "",
  isCreating: false,
  isListLoading: false,
  isFirstLoaded: false
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case SET_CURRENT_NAMESPACE: {
      state = state.set("active", action.payload.namespace);
      window.localStorage.setItem(KAPP_CURRENT_NAMESPACE_KEY, action.payload.namespace);
      break;
    }
    case LOAD_NAMESPACES_FULFILLED: {
      state = state.set("isListLoading", false);
      state = state.set("isFirstLoaded", true);
      if (
        (!state.get("active") || !action.payload.namespaces.find(x => x.get("name") === state.get("active"))) &&
        action.payload.namespaces.size > 0
      ) {
        state = state.set("active", action.payload.namespaces.get(0)!.get("name"));
      }
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
