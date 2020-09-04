import Immutable from "immutable";
import {
  LOAD_ROLE_BINDINGS_FAILED,
  LOAD_ROLE_BINDINGS_FULFILLED,
  LOAD_ROLE_BINDINGS_PENDING,
  RoleBinding,
} from "types/member";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import { LOGOUT } from "types/common";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_ROLE_BINDING,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import { addOrUpdateInList, removeInList } from "reducers/utils";

export type State = ImmutableMap<{
  isLoading: boolean;
  isFirstLoaded: boolean;
  roleBindings: Immutable.List<RoleBinding>;
}>;

const initialState: State = Immutable.Map({
  roleBindings: Immutable.List(),
  isLoading: false,
  isFirstLoaded: false,
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_ROLE_BINDINGS_FULFILLED: {
      state = state.set("isLoading", false);
      state = state.set("isFirstLoaded", true);
      return state.set("roleBindings", action.payload.roleBindings);
    }
    case LOAD_ROLE_BINDINGS_FAILED: {
      return state.set("isLoading", false);
    }
    case LOAD_ROLE_BINDINGS_PENDING: {
      return state.set("isLoading", true);
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_ROLE_BINDING) {
        return state;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state = state.update("roleBindings", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state = state.update("roleBindings", (x) => removeInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state = state.update("roleBindings", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
      }

      break;
    }
  }

  return state;
};

export default reducer;
