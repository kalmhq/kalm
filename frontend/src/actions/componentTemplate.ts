import {
  getKappComponentTemplates,
  updateKappComonentTemplate,
  createKappComonentTemplate,
  deleteKappComonentTemplate
} from "./kubernetesApi";
import {
  ComponentTemplate,
  CREATE_COMPONENT,
  DUPLICATE_COMPONENT,
  UPDATE_COMPONENT,
  LOAD_COMPONENT_TEMPLATES_PENDING,
  LOAD_COMPONENT_TEMPLATES_FULFILLED,
  DELETE_COMPONENT
} from "../types/componentTemplate";
import { ThunkResult } from "../types";

export const createComponentTemplateAction = (componentTemplateRaw: ComponentTemplate): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const componentTemplate = await createKappComonentTemplate(componentTemplateRaw);

    dispatch({
      type: CREATE_COMPONENT,
      payload: { componentTemplate }
    });
  };
};

export const duplicateComponentAction = (
  componentTemplateName: string,
  newName: string
): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    let componentTemplateCopy = getState()
      .get("componentTemplates")
      .get("componentTemplates")
      .get(componentTemplateName)!;

    componentTemplateCopy = componentTemplateCopy.set("name", newName);

    const componentTemplate = await createKappComonentTemplate(componentTemplateCopy);

    dispatch({
      type: DUPLICATE_COMPONENT,
      payload: { componentTemplate }
    });
  };
};

export const updateComponentAction = (componentTemplateRaw: ComponentTemplate): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const componentTemplate = await updateKappComonentTemplate(componentTemplateRaw);

    dispatch({
      type: UPDATE_COMPONENT,
      payload: { componentTemplate }
    });
  };
};

export const deleteComponentAction = (componentTemplateName: string): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    const componentTemplate = getState()
      .get("componentTemplates")
      .get("componentTemplates")
      .get(componentTemplateName)!;

    await deleteKappComonentTemplate(componentTemplate);

    dispatch({
      type: DELETE_COMPONENT,
      payload: { componentTemplateName }
    });
  };
};

export const loadComponentTemplatesAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_COMPONENT_TEMPLATES_PENDING });

    const componentTemplates = await getKappComponentTemplates();

    dispatch({
      type: LOAD_COMPONENT_TEMPLATES_FULFILLED,
      payload: {
        componentTemplates
      }
    });
  };
};
