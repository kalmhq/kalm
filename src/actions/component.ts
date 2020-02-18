import {
  Component,
  CREATE_COMPONENT,
  DELETE_COMPONENT,
  DUPLICATE_COMPONENT,
  LOAD_COMPONENT_TEMPLATES,
  ThunkResult,
  UPDATE_COMPONENT
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
      type: CREATE_COMPONENT,
      payload: { component }
    });
  };
};

export const duplicateComponentAction = (
  componentId: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: DUPLICATE_COMPONENT,
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
      type: UPDATE_COMPONENT,
      payload: { componentId, component }
    });
  };
};

export const deleteComponentAction = (
  componentId: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: DELETE_COMPONENT,
      payload: { componentId }
    });
  };
};

export const loadComponentTemplatesAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const components = await getKappComponentTemplates();

    dispatch({
      type: LOAD_COMPONENT_TEMPLATES,
      payload: {
        components
      }
    });
  };
};
