import { api } from "api";
import { AppThunk } from "store";
import { ThunkResult } from "types";
import {
  CREATE_ROLE_BINDINGS_FAILED,
  CREATE_ROLE_BINDINGS_FULFILLED,
  CREATE_ROLE_BINDINGS_PENDING,
  DELETE_ROLE_BINDINGS_FAILED,
  DELETE_ROLE_BINDINGS_FULFILLED,
  DELETE_ROLE_BINDINGS_PENDING,
  LOAD_ROLE_BINDINGS_FAILED,
  LOAD_ROLE_BINDINGS_FULFILLED,
  LOAD_ROLE_BINDINGS_PENDING,
  RoleBinding,
  SubjectTypeUser,
} from "types/member";

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
    dispatch({ type: DELETE_ROLE_BINDINGS_PENDING });

    try {
      await api.deleteRoleBinding(namespace, bindingName);
      dispatch({ type: DELETE_ROLE_BINDINGS_FULFILLED });
    } catch (e) {
      dispatch({ type: DELETE_ROLE_BINDINGS_FAILED });
      throw e;
    }
  };
};

export const deleteAllRoleBindingsAction = (email: string): AppThunk => {
  return async (dispatch, getState) => {
    const state = getState();
    const roleBindings = state.roles.roleBindings.filter(
      (x) => x.subject === email && x.subjectType === SubjectTypeUser,
    );
    await Promise.all(roleBindings.map((x) => api.deleteRoleBinding(x.namespace, x.name)));
  };
};
