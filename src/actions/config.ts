import { ThunkAction } from "redux-thunk";
import { RootState } from "../reducers";
import {
  CREATE_CONFIG,
  Actions,
  UPDATE_CONFIG,
  DELETE_CONFIG,
  Config,
  SET_CURRENT_CONFIG_ID_CHAIN
} from ".";

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;

export const createConfigAction = (
  config: Config
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: CREATE_CONFIG,
      payload: { config }
    });
  };
};

export const updateConfigAction = (
  configId: string,
  config: Config
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: UPDATE_CONFIG,
      payload: { configId, config }
    });
  };
};

export const deleteConfigAction = (
  configId: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: DELETE_CONFIG,
      payload: { configId }
    });
  };
};

export const setCurrentConfigIdChainAction = (
  idChain: string[]
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: SET_CURRENT_CONFIG_ID_CHAIN,
      payload: { idChain }
    });
  };
};
