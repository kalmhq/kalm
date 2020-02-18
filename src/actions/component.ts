import {
  ComponentTemplate,
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
  component: ComponentTemplate
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: CREATE_COMPONENT,
      payload: { component }
    });
  };
};

export const duplicateComponentAction = (
  componentTemplateId: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: DUPLICATE_COMPONENT,
      payload: { componentTemplateId }
    });
  };
};

export const updateComponentAction = (
  componentTemplateId: string,
  componentRaw: ComponentTemplate
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const component = await updateKappComonentTemplate(
      convertToCRDComponentTemplate(componentRaw)
    );

    dispatch({
      type: UPDATE_COMPONENT,
      payload: { componentTemplateId, component }
    });
  };
};

export const deleteComponentAction = (
  componentTemplateId: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: DELETE_COMPONENT,
      payload: { componentTemplateId }
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
