import Immutable from "immutable";
import {
  CREATE_ROLE_BINDINGS_FAILED,
  CREATE_ROLE_BINDINGS_FULFILLED,
  CREATE_ROLE_BINDINGS_PENDING,
  LOAD_ROLE_BINDINGS_FAILED,
  LOAD_ROLE_BINDINGS_FULFILLED,
  LOAD_ROLE_BINDINGS_PENDING,
  RoleBinding,
} from "types/user";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import { LOGOUT } from "types/common";

export type State = ImmutableMap<{
  roleBindingsLoading: boolean;
  roleBindingsFirstLoaded: boolean;
  roleBindings: Immutable.List<RoleBinding>;
  isRoleBindingCreating: boolean;
}>;

const initialState: State = Immutable.Map({
  roleBindings: Immutable.List(),
  roleBindingsLoading: false,
  roleBindingsFirstLoaded: false,
  isRoleBindingCreating: false,
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_ROLE_BINDINGS_FULFILLED: {
      state = state.set("roleBindingsLoading", false);
      state = state.set("roleBindingsFirstLoaded", true);
      return state.set("roleBindings", action.payload.roleBindings);
    }
    case LOAD_ROLE_BINDINGS_FAILED: {
      return state.set("roleBindingsLoading", false);
    }
    case LOAD_ROLE_BINDINGS_PENDING: {
      return state.set("roleBindingsLoading", true);
    }
    case CREATE_ROLE_BINDINGS_FAILED: {
      return state.set("isRoleBindingCreating", false);
    }
    case CREATE_ROLE_BINDINGS_FULFILLED: {
      return state.set("isRoleBindingCreating", false);
    }
    case CREATE_ROLE_BINDINGS_PENDING: {
      return state.set("isRoleBindingCreating", true);
    }
  }

  return state;
};

export default reducer;
