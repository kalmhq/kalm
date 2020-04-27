import {
  getKappComponentTemplates,
  updateKappComonentTemplate,
  createKappComonentTemplate,
  deleteKappComonentTemplate
} from "./kubernetesApi";
import {
  ComponentTemplate,
  CREATE_COMPONENT_TEMPLATES,
  DUPLICATE_COMPONENT_TEMPLATES,
  UPDATE_COMPONENT_TEMPLATES,
  LOAD_COMPONENT_TEMPLATES_PENDING,
  LOAD_COMPONENT_TEMPLATES_FULFILLED,
  DELETE_COMPONENT_TEMPLATES
} from "../types/componentTemplate";
import { ThunkResult, StatusFailure } from "../types";
import { setErrorNotificationAction } from "./notification";

export const createComponentTemplateAction = (componentTemplateRaw: ComponentTemplate): ThunkResult<Promise<void>> => {
  return async dispatch => {
    let componentTemplate: ComponentTemplate;

    try {
      componentTemplate = await createKappComonentTemplate(componentTemplateRaw);
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }

    dispatch({
      type: CREATE_COMPONENT_TEMPLATES,
      payload: { componentTemplate }
    });
  };
};

export const duplicateComponentTemplateAction = (
  componentTemplateName: string,
  newName: string
): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    let componentTemplateCopy = getState()
      .get("componentTemplates")
      .get("componentTemplates")
      .get(componentTemplateName)!;

    componentTemplateCopy = componentTemplateCopy.set("name", newName);

    let componentTemplate: ComponentTemplate;

    try {
      componentTemplate = await createKappComonentTemplate(componentTemplateCopy);
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }

    dispatch({
      type: DUPLICATE_COMPONENT_TEMPLATES,
      payload: { componentTemplate }
    });
  };
};

export const updateComponentTemplateAction = (componentTemplateRaw: ComponentTemplate): ThunkResult<Promise<void>> => {
  return async dispatch => {
    let componentTemplate: ComponentTemplate;

    try {
      componentTemplate = await updateKappComonentTemplate(componentTemplateRaw);
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }

    dispatch({
      type: UPDATE_COMPONENT_TEMPLATES,
      payload: { componentTemplate }
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

    try {
      await deleteKappComonentTemplate(componentTemplate);
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }

    dispatch({
      type: DELETE_COMPONENT_TEMPLATES,
      payload: { componentTemplateName }
    });
  };
};

export const loadComponentTemplatesAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_COMPONENT_TEMPLATES_PENDING });

    let componentTemplates;
    try {
      componentTemplates = await getKappComponentTemplates();
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: LOAD_COMPONENT_TEMPLATES_PENDING });
      return;
    }

    dispatch({
      type: LOAD_COMPONENT_TEMPLATES_FULFILLED,
      payload: {
        componentTemplates
      }
    });
  };
};
