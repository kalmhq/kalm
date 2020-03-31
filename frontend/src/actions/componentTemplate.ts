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
      type: DUPLICATE_COMPONENT,
      payload: { componentTemplate }
    });
  };
};

export const updateComponentAction = (componentTemplateRaw: ComponentTemplate): ThunkResult<Promise<void>> => {
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
      type: DELETE_COMPONENT,
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
