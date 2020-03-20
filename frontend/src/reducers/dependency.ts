import Immutable from "immutable";
import { LOAD_DEPENDENCIES_FULFILLED, LOAD_DEPENDENCIES_PENDING, KappDependency } from "../types/dependency";
import { ImmutableMap } from "../typings";
import { Actions } from "../types";

export interface DependencyStateContent {
  dependencies: Immutable.OrderedMap<string, KappDependency>;
  isListLoading: boolean;
  isListFirstLoaded: boolean;
}

export type State = ImmutableMap<DependencyStateContent>;

const initialState: State = Immutable.Map({
  dependencies: Immutable.OrderedMap({}),
  isListLoading: false,
  isListFirstLoaded: false
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_DEPENDENCIES_PENDING: {
      state = state.set("isListLoading", true);
      break;
    }
    case LOAD_DEPENDENCIES_FULFILLED: {
      state = state.set("isListFirstLoaded", true).set("isListLoading", false);
      let om = Immutable.OrderedMap<string, KappDependency>();

      action.payload.dependencies.forEach(x => {
        om = om.set(x.get("name"), x);
      });

      state = state.set("dependencies", om);
      break;
    }
  }

  return state;
};

export default reducer;
