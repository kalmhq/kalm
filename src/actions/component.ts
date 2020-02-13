import {
  CREATE_COMPONENT_ACTION,
  ComponentFormValues,
  UPDATE_COMPONENT_ACTION,
  DELETE_COMPONENT_ACTION,
  ThunkResult,
  DUPLICATE_COMPONENT_ACTION
} from ".";

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

export const duplicateComponentAction = (
  componentId: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: DUPLICATE_COMPONENT_ACTION,
      payload: { componentId }
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
