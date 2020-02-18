import {
  CREATE_APPLICATION,
  Application,
  UPDATE_APPLICATION,
  DELETE_APPLICATION,
  ThunkResult,
  DUPLICATE_APPLICATION
} from ".";

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
