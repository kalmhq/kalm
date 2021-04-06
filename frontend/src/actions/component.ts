import { api } from "api";
import { AppThunk } from "store";
import {
  ApplicationComponent,
  ApplicationComponentDetails,
  CREATE_COMPONENT,
  DELETE_COMPONENT,
  LOAD_COMPONENTS_FAILED,
  LOAD_COMPONENTS_FULFILLED,
  LOAD_COMPONENTS_PENDING,
  UPDATE_COMPONENT,
} from "types/application";
import { correctComponentFormValuesForSubmit } from "utils/application";
import { setIsSubmittingApplicationComponentAction } from "./application";

export const loadComponentsAction = (namespace: string): AppThunk => {
  return async (dispatch) => {
    dispatch({ type: LOAD_COMPONENTS_PENDING });

    let components: ApplicationComponentDetails[];
    try {
      components = await api.getApplicationComponentList(namespace);
    } catch (e) {
      dispatch({ type: LOAD_COMPONENTS_FAILED });
      throw e;
    }

    dispatch({
      type: LOAD_COMPONENTS_FULFILLED,
      payload: {
        applicationName: namespace,
        components,
      },
    });
  };
};

export const createComponentAction = (componentValues: ApplicationComponent, applicationName?: string): AppThunk => {
  return async (dispatch, getState) => {
    if (!applicationName) {
      applicationName = getState().namespaces.active;
    }

    dispatch(setIsSubmittingApplicationComponentAction(true));

    let component: ApplicationComponentDetails;
    try {
      component = await api.createApplicationComponent(
        applicationName,
        correctComponentFormValuesForSubmit(getState(), componentValues),
      );
    } catch (e) {
      dispatch(setIsSubmittingApplicationComponentAction(false));
      throw e;
    }

    dispatch(setIsSubmittingApplicationComponentAction(false));

    await dispatch({
      type: CREATE_COMPONENT,
      payload: { applicationName, component },
    });
  };
};

export const updateComponentAction = (componentValues: ApplicationComponent, applicationName?: string): AppThunk => {
  return async (dispatch, getState) => {
    if (!applicationName) {
      applicationName = getState().namespaces.active;
    }

    dispatch(setIsSubmittingApplicationComponentAction(true));

    let component: ApplicationComponentDetails;
    try {
      component = await api.updateApplicationComponent(
        applicationName,
        correctComponentFormValuesForSubmit(getState(), componentValues),
      );
    } catch (e) {
      dispatch(setIsSubmittingApplicationComponentAction(false));
      throw e;
    }
    dispatch(setIsSubmittingApplicationComponentAction(false));

    await dispatch({
      type: UPDATE_COMPONENT,
      payload: { applicationName, component },
    });
  };
};

export const deleteComponentAction = (componentName: string, applicationName?: string): AppThunk => {
  return async (dispatch, getState) => {
    if (!applicationName) {
      applicationName = getState().namespaces.active;
    }

    await api.deleteApplicationComponent(applicationName, componentName);

    dispatch({
      type: DELETE_COMPONENT,
      payload: { applicationName, componentName },
    });
  };
};
