import { ThunkResult } from "types";
import {
  CREATE_DEPLOY_KEY_FAILED,
  CREATE_DEPLOY_KEY_FULFILLED,
  CREATE_DEPLOY_KEY_PENDING,
  DELETE_DEPLOY_KEY_FAILED,
  DELETE_DEPLOY_KEY_FULFILLED,
  DELETE_DEPLOY_KEY_PENDING,
  DeployKeyFormType,
  LOAD_DEPLOY_KEYS_FAILED,
  LOAD_DEPLOY_KEYS_FULFILLED,
  LOAD_DEPLOY_KEYS_PENDING,
  DeployKeyFormTypeContent,
} from "types/deployKey";

import { api } from "api";
import { Map } from "immutable";

export const loadDeployKeyAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_DEPLOY_KEYS_PENDING });
    try {
      const keys = await api.listDeployKeys();

      dispatch({
        type: LOAD_DEPLOY_KEYS_FULFILLED,
        payload: keys,
      });
    } catch (e) {
      dispatch({ type: LOAD_DEPLOY_KEYS_FAILED });
      throw e;
    }
  };
};

export const createDeployKeyAction = (key: DeployKeyFormTypeContent): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: CREATE_DEPLOY_KEY_PENDING });
      const keyRes = await api.createDeployKey(key);
      dispatch({
        type: CREATE_DEPLOY_KEY_FULFILLED,
        payload: Map(keyRes),
      });
    } catch (e) {
      dispatch({ type: CREATE_DEPLOY_KEY_FAILED });
      throw e;
    }
  };
};

export const deleteDeployKeyAction = (key: DeployKeyFormType): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: DELETE_DEPLOY_KEY_PENDING });
      await api.deleteDeployKey(key);
      dispatch({ type: DELETE_DEPLOY_KEY_FULFILLED });
    } catch (e) {
      dispatch({ type: DELETE_DEPLOY_KEY_FAILED });
      throw e;
    }
  };
};
