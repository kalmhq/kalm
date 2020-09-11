import { ThunkResult } from "types";
import {
  CREATE_ROLE_BINDINGS_FAILED,
  CREATE_ROLE_BINDINGS_FULFILLED,
  CREATE_ROLE_BINDINGS_PENDING,
  LOAD_ROLE_BINDINGS_FAILED,
  LOAD_ROLE_BINDINGS_FULFILLED,
  LOAD_ROLE_BINDINGS_PENDING,
  RoleBinding,
} from "types/member";
import { api } from "api";

export const loadRoleBindingsAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_ROLE_BINDINGS_PENDING });

    try {
      const roleBindings = await api.loadRoleBindings();

      dispatch({
        type: LOAD_ROLE_BINDINGS_FULFILLED,
        payload: {
          roleBindings,
        },
      });
    } catch (e) {
      dispatch({ type: LOAD_ROLE_BINDINGS_FAILED });
      throw e;
    }
  };
};

export const createRoleBindingsAction = (roleBindingsBody: RoleBinding): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: CREATE_ROLE_BINDINGS_PENDING });

    try {
      await api.createRoleBinding(roleBindingsBody);
      dispatch({ type: CREATE_ROLE_BINDINGS_FULFILLED });
    } catch (e) {
      dispatch({ type: CREATE_ROLE_BINDINGS_FAILED });
      throw e;
    }
  };
};

export const updateRoleBindingsAction = (roleBindingsBody: RoleBinding): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    try {
      await api.updateRoleBinding(roleBindingsBody);
    } catch (e) {
      throw e;
    }
  };
};

export const deleteRoleBindingsAction = (namespace: string, bindingName: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: CREATE_ROLE_BINDINGS_PENDING });

    try {
      await api.deleteRoleBinding(namespace, bindingName);
      dispatch({ type: CREATE_ROLE_BINDINGS_FULFILLED });
    } catch (e) {
      dispatch({ type: CREATE_ROLE_BINDINGS_FAILED });
      throw e;
    }
  };
};
