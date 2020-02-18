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
  config = config.set("id", "666"); // TODO fake id now

  const newIdChain = config.get("ancestorIds")
    ? config.get("ancestorIds")!.toArray()
    : [];
  newIdChain.push(config.get("id"));

  return async dispatch => {
    dispatch({
      type: CREATE_CONFIG,
      payload: { config }
    });
    dispatch(setCurrentConfigIdChainAction(newIdChain));
  };
};

export const updateConfigAction = (
  config: Config
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: UPDATE_CONFIG,
      payload: { config }
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
