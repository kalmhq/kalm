import produce from "immer";
import { Actions } from "types";
import { LOGOUT } from "types/common";
import {
  CREATE_REGISTRY,
  DELETE_REGISTRY,
  LOAD_REGISTRIES_FAILED,
  LOAD_REGISTRIES_FULFILLED,
  LOAD_REGISTRIES_PENDING,
  Registry,
  SET_IS_SUBMITTING_REGISTRY,
  UPDATE_REGISTRY,
} from "types/registry";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_REGISTRY,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import { addOrUpdateInArray, isInArray, removeInArray, removeInArrayByName } from "./utils";

type State = {
  isLoading: boolean;
  isFirstLoaded: boolean;
  isSubmittingRegistry: boolean;
  registries: Registry[];
};

const initialState: State = {
  isLoading: false,
  isFirstLoaded: false,
  isSubmittingRegistry: false,
  registries: [],
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_REGISTRIES_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_REGISTRIES_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_REGISTRIES_FULFILLED: {
      state.isLoading = false;
      state.isFirstLoaded = false;
      state.registries = action.payload.registries;
      return;
    }
    case CREATE_REGISTRY: {
      state.registries = addOrUpdateInArray(state.registries, action.payload.registry);
      return;
    }
    case UPDATE_REGISTRY: {
      state.registries = addOrUpdateInArray(state.registries, action.payload.registry);
      return;
    }
    case DELETE_REGISTRY: {
      state.registries = removeInArrayByName(state.registries, action.payload.name);
      return;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_REGISTRY) {
        return;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          if (!isInArray(state.registries, action.payload.data)) {
            state.registries = addOrUpdateInArray(state.registries, action.payload.data);
          }
          return;
        }
        case RESOURCE_ACTION_DELETE: {
          state.registries = removeInArray(state.registries, action.payload.data);
          return;
        }
        case RESOURCE_ACTION_UPDATE: {
          state.registries = addOrUpdateInArray(state.registries, action.payload.data);
          return;
        }
        default:
          return;
      }
    }
    case SET_IS_SUBMITTING_REGISTRY: {
      state.isSubmittingRegistry = action.payload.isSubmittingRegistry;
      return;
    }
  }

  return;
}, initialState);

export default reducer;
