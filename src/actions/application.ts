import {
  Application,
  CREATE_APPLICATION,
  DELETE_APPLICATION,
  DUPLICATE_APPLICATION,
  LOAD_APPLICATIONS_FULFILLED,
  ThunkResult,
  UPDATE_APPLICATION,
  LOAD_APPLICATIONS_PENDING
} from ".";
import { getKappApplications } from "./kubernetesApi";

export const createApplicationAction = (
  applicationValues: Application
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: CREATE_APPLICATION,
      payload: { applicationValues }
    });
  };
};

export const updateApplicationAction = (
  applicationId: string,
  applicationValues: Application
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: UPDATE_APPLICATION,
      payload: { applicationId, applicationValues }
    });
  };
};

export const duplicateApplicationAction = (
  applicationId: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: DUPLICATE_APPLICATION,
      payload: { applicationId }
    });
  };
};

export const deleteApplicationAction = (
  applicationId: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: DELETE_APPLICATION,
      payload: { applicationId }
    });
  };
};

export const loadApplicationsAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_APPLICATIONS_PENDING });

    const applications = await getKappApplications();

    dispatch({
      type: LOAD_APPLICATIONS_FULFILLED,
      payload: {
        applications
      }
    });
  };
};
