import { ThunkAction } from "redux-thunk";
import { RootState } from "../reducers";
import { CREATE_COMPONENT_ACTION, Actions, ComponentFormValues } from ".";

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
