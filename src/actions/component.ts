import { ThunkAction } from "redux-thunk";
import { RootState } from "../reducers";
import {
  CREATE_COMPONENT_ACTION,
  Actions,
  ComponentFormValues,
  UPDATE_COMPONENT_ACTION,
  DELETE_COMPONENT_ACTION
} from ".";

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;

export const createComponentAction = (
  componentValues: ComponentFormValues
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: CREATE_COMPONENT_ACTION,
      payload: { componentValues }
    });
  };
};

export const updateComponentAction = (
  componentId: string,
  componentValues: ComponentFormValues
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: UPDATE_COMPONENT_ACTION,
      payload: { componentId, componentValues }
    });
  };
};

export const deleteComponentAction = (
  componentId: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: DELETE_COMPONENT_ACTION,
      payload: { componentId }
    });
  };
};
