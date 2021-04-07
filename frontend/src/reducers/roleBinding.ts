import produce from "immer";
import { addOrUpdateInArray, removeInArray } from "reducers/utils";
import { Actions } from "types";
import { LOGOUT } from "types/common";
import {
  LOAD_ROLE_BINDINGS_FAILED,
  LOAD_ROLE_BINDINGS_FULFILLED,
  LOAD_ROLE_BINDINGS_PENDING,
  RoleBinding,
} from "types/member";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_ROLE_BINDING,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";

type State = {
  isLoading: boolean;
  isFirstLoaded: boolean;
  roleBindings: RoleBinding[];
};

const initialState: State = {
  roleBindings: [],
  isLoading: false,
  isFirstLoaded: false,
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_ROLE_BINDINGS_FULFILLED: {
      state.isLoading = false;
      state.isFirstLoaded = true;
      state.roleBindings = action.payload.roleBindings;
      return;
    }
    case LOAD_ROLE_BINDINGS_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_ROLE_BINDINGS_PENDING: {
      state.isLoading = true;
      return;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_ROLE_BINDING) {
        return;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state.roleBindings = addOrUpdateInArray(state.roleBindings, action.payload.data);
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state.roleBindings = removeInArray(state.roleBindings, action.payload.data);
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state.roleBindings = addOrUpdateInArray(state.roleBindings, action.payload.data);
          break;
        }
      }

      return;
    }
  }

  return state;
}, initialState);

export default reducer;
