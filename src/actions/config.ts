import { ThunkAction } from "redux-thunk";
import { RootState } from "../reducers";
import {
  CREATE_CONFIG_ACTION,
  Actions,
  UPDATE_CONFIG_ACTION,
  DELETE_CONFIG_ACTION,
  ConfigFormValues
} from ".";

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;

export const createConfigAction = (
  config: ConfigFormValues
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: CREATE_CONFIG_ACTION,
      payload: { config }
    });
  };
};

export const updateConfigAction = (
  configId: string,
  config: ConfigFormValues
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: UPDATE_CONFIG_ACTION,
      payload: { configId, config }
    });
  };
};

export const deleteConfigAction = (
  configId: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: DELETE_CONFIG_ACTION,
      payload: { configId }
    });
  };
};
