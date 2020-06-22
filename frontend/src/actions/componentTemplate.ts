import { ThunkResult } from "../types";
import {
  ComponentTemplate,
  CREATE_COMPONENT_TEMPLATES,
  DELETE_COMPONENT_TEMPLATES,
  DUPLICATE_COMPONENT_TEMPLATES,
  LOAD_COMPONENT_TEMPLATES_FULFILLED,
  LOAD_COMPONENT_TEMPLATES_PENDING,
  UPDATE_COMPONENT_TEMPLATES,
} from "../types/componentTemplate";
import {
  createKappComonentTemplate,
  deleteKappComonentTemplate,
  getKappComponentTemplates,
  updateKappComonentTemplate,
} from "./kubernetesApi";

export const createComponentTemplateAction = (componentTemplateRaw: ComponentTemplate): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    let componentTemplate: ComponentTemplate;
    componentTemplate = await createKappComonentTemplate(componentTemplateRaw);

    dispatch({
      type: CREATE_COMPONENT_TEMPLATES,
      payload: { componentTemplate },
    });
  };
};

export const duplicateComponentTemplateAction = (
  componentTemplateName: string,
  newName: string,
): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    let componentTemplateCopy = getState()
      .get("componentTemplates")
      .get("componentTemplates")
      .get(componentTemplateName)!;

    componentTemplateCopy = componentTemplateCopy.set("name", newName);

    let componentTemplate: ComponentTemplate;
    componentTemplate = await createKappComonentTemplate(componentTemplateCopy);

    dispatch({
      type: DUPLICATE_COMPONENT_TEMPLATES,
      payload: { componentTemplate },
    });
  };
};

export const updateComponentTemplateAction = (componentTemplateRaw: ComponentTemplate): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    let componentTemplate: ComponentTemplate;
    componentTemplate = await updateKappComonentTemplate(componentTemplateRaw);

    dispatch({
      type: UPDATE_COMPONENT_TEMPLATES,
      payload: { componentTemplate },
    });
  };
};

export const deleteComponentTemplateAction = (componentTemplateName: string): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    const componentTemplate = getState()
      .get("componentTemplates")
      .get("componentTemplates")
      .get(componentTemplateName)!;

    await deleteKappComonentTemplate(componentTemplate);

    dispatch({
      type: DELETE_COMPONENT_TEMPLATES,
      payload: { componentTemplateName },
    });
  };
};

export const loadComponentTemplatesAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_COMPONENT_TEMPLATES_PENDING });

    let componentTemplates;
    try {
      componentTemplates = await getKappComponentTemplates();
    } catch (e) {
      dispatch({ type: LOAD_COMPONENT_TEMPLATES_PENDING });
      throw e;
    }

    dispatch({
      type: LOAD_COMPONENT_TEMPLATES_FULFILLED,
      payload: {
        componentTemplates,
      },
    });
  };
};
