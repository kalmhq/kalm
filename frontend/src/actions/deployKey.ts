import { ThunkResult } from "types";
import {
  CREATE_DEPLOY_ACCESS_TOKEN_FAILED,
  CREATE_DEPLOY_ACCESS_TOKEN_FULFILLED,
  CREATE_DEPLOY_ACCESS_TOKEN_PENDING,
  DELETE_DEPLOY_ACCESS_TOKEN_FAILED,
  DELETE_DEPLOY_ACCESS_TOKEN_FULFILLED,
  DELETE_DEPLOY_ACCESS_TOKEN_PENDING,
  DeployAccessToken,
  LOAD_DEPLOY_ACCESS_TOKENS_FAILED,
  LOAD_DEPLOY_ACCESS_TOKENS_FULFILLED,
  LOAD_DEPLOY_ACCESS_TOKENS_PENDING,
} from "types/deployAccessToken";

import { api } from "api";

export const loadDeployKeyAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_DEPLOY_ACCESS_TOKENS_PENDING });
    try {
      const keys = await api.listDeployKeys();

      dispatch({
        type: LOAD_DEPLOY_ACCESS_TOKENS_FULFILLED,
        payload: keys,
      });
    } catch (e) {
      dispatch({ type: LOAD_DEPLOY_ACCESS_TOKENS_FAILED });
      throw e;
    }
  };
};

export const createDeployKeyAction = (key: DeployAccessToken): ThunkResult<Promise<DeployAccessToken>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: CREATE_DEPLOY_ACCESS_TOKEN_PENDING });

      const keyRes = await api.createDeployKey(key);

      await dispatch({
        type: CREATE_DEPLOY_ACCESS_TOKEN_FULFILLED,
        payload: keyRes,
      });

      return keyRes;
    } catch (e) {
      dispatch({ type: CREATE_DEPLOY_ACCESS_TOKEN_FAILED });
      throw e;
    }
  };
};

export const deleteDeployKeyAction = (key: DeployAccessToken): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: DELETE_DEPLOY_ACCESS_TOKEN_PENDING });
      await api.deleteDeployKey(key);
      dispatch({ type: DELETE_DEPLOY_ACCESS_TOKEN_FULFILLED });
    } catch (e) {
      dispatch({ type: DELETE_DEPLOY_ACCESS_TOKEN_FAILED });
      throw e;
    }
  };
};
