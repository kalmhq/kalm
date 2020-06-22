import Immutable from "immutable";
import {
  CREATE_REGISTRY,
  DELETE_REGISTRY,
  LOAD_REGISTRIES_FAILED,
  LOAD_REGISTRIES_FULFILLED,
  LOAD_REGISTRIES_PENDING,
  RegistryType,
  SET_IS_SUBMITTING_REGISTRY,
  UPDATE_REGISTRY,
} from "types/registry";
import { Actions } from "../types";
import { LOGOUT } from "../types/common";
import { ImmutableMap } from "../typings";

export type State = ImmutableMap<{
  isLoading: boolean;
  isFirstLoaded: boolean;
  isSubmittingRegistry: boolean;
  registries: Immutable.List<RegistryType>;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  isFirstLoaded: false,
  isSubmittingRegistry: false,
  registries: Immutable.List([]),
});

const putRegistryIntoState = (state: State, registry: RegistryType): State => {
  const registries = state.get("registries");
  const index = registries.findIndex((app) => app.get("name") === registry.get("name"));

  if (index < 0) {
    state = state.set("registries", registries.push(registry));
  } else {
    state = state.setIn(["registries", index], registry);
  }
  return state;
};

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
    case LOAD_REGISTRIES_FULFILLED: {
      state = state.set("isLoading", false);
      state = state.set("isFirstLoaded", true);
      state = state.set("registries", action.payload.registries);
      return state;
    }
    case CREATE_REGISTRY: {
      state = putRegistryIntoState(state, action.payload.registry);
      break;
    }
    case UPDATE_REGISTRY: {
      state = putRegistryIntoState(state, action.payload.registry);
      break;
    }
    case DELETE_REGISTRY: {
      const registries = state.get("registries");
      const index = registries.findIndex((r) => r.get("name") === action.payload.name);

      if (index >= 0) {
        state = state.deleteIn(["registries", index]);
      }

      break;
    }
    case SET_IS_SUBMITTING_REGISTRY: {
      state = state.set("isSubmittingRegistry", action.payload.isSubmittingRegistry);
      break;
    }
  }

  return state;
};

export default reducer;
