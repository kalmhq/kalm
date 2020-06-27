import { ThunkResult } from "../types";
import {
  CREATE_ROLE_BINDINGS_FAILED,
  CREATE_ROLE_BINDINGS_FULFILLED,
  CREATE_ROLE_BINDINGS_PENDING,
  LOAD_ROLE_BINDINGS_FAILED,
  LOAD_ROLE_BINDINGS_FULFILLED,
  LOAD_ROLE_BINDINGS_PENDING,
  RoleBindingsRequestBody,
} from "../types/user";
import { api } from "api";

export const loadRoleBindingsAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_ROLE_BINDINGS_PENDING });

    try {
      const roleBindings = await api.loadRolebindings();

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

export const createRoleBindingsAction = (roleBindingsBody: RoleBindingsRequestBody): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: CREATE_ROLE_BINDINGS_PENDING });

    try {
      await api.createRoleBindings(roleBindingsBody);
      dispatch({ type: CREATE_ROLE_BINDINGS_FULFILLED });
      dispatch(loadRoleBindingsAction());
    } catch (e) {
      dispatch({ type: CREATE_ROLE_BINDINGS_FAILED });
      throw e;
    }
  };
};

export const deleteRoleBindingsAction = (namespace: string, bindingName: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: CREATE_ROLE_BINDINGS_PENDING });

    try {
      await api.deleteRoleBindings(namespace, bindingName);
      dispatch({ type: CREATE_ROLE_BINDINGS_FULFILLED });
      dispatch(loadRoleBindingsAction());
    } catch (e) {
      dispatch({ type: CREATE_ROLE_BINDINGS_FAILED });
      throw e;
    }
  };
};
