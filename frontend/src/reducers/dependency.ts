import Immutable from "immutable";
import {
  KappDependency,
  LOAD_DEPENDENCIES_FAILED,
  LOAD_DEPENDENCIES_FULFILLED,
  LOAD_DEPENDENCIES_PENDING,
} from "../types/dependency";
import { ImmutableMap } from "../typings";
import { Actions } from "../types";
import { LOGOUT } from "types/common";

export interface DependencyStateContent {
  dependencies: Immutable.OrderedMap<string, KappDependency>;
  isListLoading: boolean;
  isListFirstLoaded: boolean;
}

export type State = ImmutableMap<DependencyStateContent>;

const initialState: State = Immutable.Map({
  dependencies: Immutable.OrderedMap({}),
  isListLoading: false,
  isListFirstLoaded: false,
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_DEPENDENCIES_PENDING: {
      state = state.set("isListLoading", true);
      break;
    }
    case LOAD_DEPENDENCIES_FAILED: {
      state = state.set("isListLoading", false);
      break;
    }
    case LOAD_DEPENDENCIES_FULFILLED: {
      state = state.set("isListFirstLoaded", true).set("isListLoading", false);
      let om = Immutable.OrderedMap<string, KappDependency>();

      action.payload.dependencies.forEach((x) => {
        om = om.set(x.get("name"), x);
      });

      state = state.set("dependencies", om);
      break;
    }
  }

  return state;
};

export default reducer;
