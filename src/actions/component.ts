import {
  Component,
  CREATE_COMPONENT_ACTION,
  DELETE_COMPONENT_ACTION,
  DUPLICATE_COMPONENT_ACTION,
  LOAD_COMPONENTS_ACTION,
  ThunkResult,
  UPDATE_COMPONENT_ACTION
} from ".";
import { getKappComponents, updateKappComonentTemplate } from "./kubernetesApi";
import { convertToCRDComponentTemplate } from "../convertors/ComponentTemplate";

export const createComponentAction = (
  component: Component
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: CREATE_COMPONENT_ACTION,
      payload: { component }
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
  componentRaw: Component
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const component = await updateKappComonentTemplate(
      convertToCRDComponentTemplate(componentRaw)
    );

    dispatch({
      type: UPDATE_COMPONENT_ACTION,
      payload: { componentId, component }
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
