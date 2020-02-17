import {
  Component,
  CREATE_COMPONENT_ACTION,
  DELETE_COMPONENT_ACTION,
  DUPLICATE_COMPONENT_ACTION,
  LOAD_COMPONENTS_ACTION,
  ThunkResult,
  UPDATE_COMPONENT_ACTION
} from ".";
import { getKappComponents } from "./kubernetesApi";

export const createComponentAction = (
  componentValues: Component
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
  componentValues: Component
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

export const loadComponentAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const components = await getKappComponents();
    dispatch({
      type: LOAD_COMPONENTS_ACTION,
      payload: {
        components
      }
    });
  };
};
