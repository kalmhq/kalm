import {
  Component,
  CREATE_COMPONENT,
  DELETE_COMPONENT,
  DUPLICATE_COMPONENT,
  ThunkResult,
  UPDATE_COMPONENT,
  LOAD_COMPONENT_TEMPLATES_FULFILLED,
  LOAD_COMPONENT_TEMPLATES_PENDING
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
    dispatch({ type: LOAD_COMPONENT_TEMPLATES_PENDING });

    const components = await getKappComponentTemplates();

    dispatch({
      type: LOAD_COMPONENT_TEMPLATES_FULFILLED,
      payload: {
        components
      }
    });
  };
};
