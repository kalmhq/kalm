import {
  Component,
  CREATE_COMPONENT_ACTION,
  DELETE_COMPONENT_ACTION,
  DUPLICATE_COMPONENT_ACTION,
  LOAD_COMPONENT_TEMPLATES_ACTION,
  ThunkResult,
  UPDATE_COMPONENT_ACTION
} from ".";
import {
  getKappComponentTemplates,
  updateKappComonentTemplate
} from "./kubernetesApi";
import { convertToCRDComponentTemplate } from "../convertors/ComponentTemplate";

export const createComponentTemplateAction = (
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

export const loadComponentTemplatesAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const components = await getKappComponentTemplates();

    dispatch({
      type: LOAD_COMPONENT_TEMPLATES_ACTION,
      payload: {
        components
      }
    });
  };
};
