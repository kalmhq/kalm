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
import { Actions } from "types";
import { LOGOUT } from "types/common";
import { ImmutableMap } from "typings";
import {
  WATCHED_RESOURCE_CHANGE,
  RESOURCE_TYPE_REGISTRY,
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
} from "types/resources";
import { addOrUpdateInList, removeInList, removeInListByName, isInList } from "./utils";

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
      state = state.update("registries", (x) => addOrUpdateInList(x, action.payload.registry));
      break;
    }
    case UPDATE_REGISTRY: {
      state = state.update("registries", (x) => addOrUpdateInList(x, action.payload.registry));
      break;
    }
    case DELETE_REGISTRY: {
      state = state.update("registries", (x) => removeInListByName(x, action.payload.name));
      break;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_REGISTRY) {
        return state;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          if (!isInList(state.get("registries"), action.payload.data)) {
            state = state.update("registries", (x) => addOrUpdateInList(x, action.payload.data));
          }
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state = state.update("registries", (x) => removeInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state = state.update("registries", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
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
