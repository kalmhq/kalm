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
  updateKappComonentTemplate,
  createKappComonentTemplate,
  deleteKappComonentTemplate
} from "./kubernetesApi";
import { convertToCRDComponentTemplate } from "../convertors/ComponentTemplate";

export const createComponentTemplateAction = (componentTemplateRaw: ComponentTemplate): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const componentTemplate = await createKappComonentTemplate(convertToCRDComponentTemplate(componentTemplateRaw));

    dispatch({
      type: CREATE_COMPONENT,
      payload: { componentTemplate }
    });
  };
};

export const duplicateComponentAction = (componentTemplateId: string, newName: string): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    let componentTemplateCopy = getState()
      .get("componentTemplates")
      .get("componentTemplates")
      .get(componentTemplateId)!;

    componentTemplateCopy = componentTemplateCopy.set("name", newName);
    componentTemplateCopy = componentTemplateCopy.delete("resourceVersion");

    const componentTemplate = await createKappComonentTemplate(convertToCRDComponentTemplate(componentTemplateCopy));

    dispatch({
      type: DUPLICATE_COMPONENT,
      payload: { componentTemplate }
    });
  };
};

export const updateComponentAction = (
  componentTemplateId: string,
  componentTemplateRaw: ComponentTemplate
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const componentTemplate = await updateKappComonentTemplate(convertToCRDComponentTemplate(componentTemplateRaw));

    dispatch({
      type: UPDATE_COMPONENT,
      payload: { componentTemplateId, componentTemplate }
    });
  };
};

export const deleteComponentAction = (componentTemplateId: string): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    const componentTemplate = getState()
      .get("componentTemplates")
      .get("componentTemplates")
      .get(componentTemplateId)!;

    await deleteKappComonentTemplate(convertToCRDComponentTemplate(componentTemplate));

    dispatch({
      type: DELETE_COMPONENT,
      payload: { componentTemplateId }
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
