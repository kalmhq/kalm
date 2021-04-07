import { api } from "api";
import { ThunkResult } from "types";
import {
  Application,
  ApplicationDetails,
  CREATE_APPLICATION,
  DELETE_APPLICATION,
  SetIsSubmittingApplication,
  SetIsSubmittingApplicationComponent,
  SET_IS_SUBMITTING_APPLICATION,
  SET_IS_SUBMITTING_APPLICATION_COMPONENT,
} from "types/application";

export const createApplicationAction = (applicationValues: Application): ThunkResult<Promise<Application>> => {
  return async (dispatch) => {
    dispatch(setIsSubmittingApplicationAction(true));

    let application: ApplicationDetails;

    try {
      application = await api.createApplication(applicationValues);
    } catch (e) {
      dispatch(setIsSubmittingApplicationAction(false));
      throw e;
    }

    dispatch(setIsSubmittingApplicationAction(false));

    await dispatch({
      type: CREATE_APPLICATION,
      payload: { application },
    });
    return application;
  };
};

export const deleteApplicationAction = (name: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    await api.deleteApplication(name);
    dispatch({
      type: DELETE_APPLICATION,
      payload: { applicationName: name },
    });
  };
};

export const setIsSubmittingApplicationAction = (isSubmittingApplication: boolean): SetIsSubmittingApplication => {
  return {
    type: SET_IS_SUBMITTING_APPLICATION,
    payload: {
      isSubmittingApplication,
    },
  };
};

export const setIsSubmittingApplicationComponentAction = (
  isSubmittingApplicationComponent: boolean,
): SetIsSubmittingApplicationComponent => {
  return {
    type: SET_IS_SUBMITTING_APPLICATION_COMPONENT,
    payload: {
      isSubmittingApplicationComponent,
    },
  };
};
