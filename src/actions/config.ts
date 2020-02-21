import { ThunkAction } from "redux-thunk";
import { RootState } from "../reducers";
import {
  CREATE_CONFIG,
  Actions,
  UPDATE_CONFIG,
  DELETE_CONFIG,
  Config,
  SET_CURRENT_CONFIG_ID_CHAIN,
  DUPLICATE_CONFIG
} from ".";
import Immutable from "immutable";
import { ID } from "../utils";

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;

export const createConfigAction = (
  config: Config
): ThunkResult<Promise<void>> => {
  config = config.set("id", ID()); // TODO fake id now

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

export const duplicateConfigAction = (
  config: Config
): ThunkResult<Promise<void>> => {
  config = Immutable.fromJS({
    id: ID(), // TODO fake id now
    name: config.get("name") + "-duplicate",
    type: config.get("type"),
    content: config.get("content"),
    ancestorIds: config.get("ancestorIds")
  });

  const newIdChain = config.get("ancestorIds")
    ? config.get("ancestorIds")!.toArray()
    : [];
  newIdChain.push(config.get("id"));
  return async dispatch => {
    dispatch({
      type: DUPLICATE_CONFIG,
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
  config: Config
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch(setCurrentConfigIdChainAction(["0"]));
    dispatch({
      type: DELETE_CONFIG,
      payload: { config }
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
