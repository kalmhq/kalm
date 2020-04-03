import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import { Actions } from "../types";
import {
  LOAD_NAMESPACES_PENDING,
  LOAD_NAMESPACES_FAILED,
  LOAD_NAMESPACES_FULFILLED,
  SET_CURRENT_NAMESPACE
} from "../types/namespace";

export type State = ImmutableMap<{
  currentNamespace: string;
  isListLoading: boolean;
  namespaces: string[];
}>;

const KAPP_CURRENT_NAMESPACE_KEY = "KAPP_CURRENT_NAMESPACE_KEY";

const initialState: State = Immutable.Map({
  currentNamespace: window.localStorage.getItem(KAPP_CURRENT_NAMESPACE_KEY) || "default",
  isListFirstLoaded: false,
  namespaces: []
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case SET_CURRENT_NAMESPACE: {
      state = state.set("currentNamespace", action.payload.namespace);
      window.localStorage.setItem(KAPP_CURRENT_NAMESPACE_KEY, action.payload.namespace);
      break;
    }
    case LOAD_NAMESPACES_PENDING: {
      state = state.set("isListLoading", true);
      break;
    }
    case LOAD_NAMESPACES_FAILED: {
      state = state.set("isListLoading", false);
      break;
    }
    case LOAD_NAMESPACES_FULFILLED: {
      state = state.set("isListLoading", false);

      state = state.set("namespaces", action.payload.namespaces);
      break;
    }
  }
  return state;
};

export default reducer;
