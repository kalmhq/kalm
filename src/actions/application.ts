import {
  CREATE_APPLICATION_ACTION,
  Application,
  UPDATE_APPLICATION_ACTION,
  DELETE_APPLICATION_ACTION,
  ThunkResult,
  DUPLICATE_APPLICATION_ACTION
} from ".";

export const createApplicationAction = (
  applicationValues: Application
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: CREATE_APPLICATION_ACTION,
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
      type: UPDATE_APPLICATION_ACTION,
      payload: { applicationId, applicationValues }
    });
  };
};

export const duplicateApplicationAction = (
  applicationId: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: DUPLICATE_APPLICATION_ACTION,
      payload: { applicationId }
    });
  };
};

export const deleteApplicationAction = (
  applicationId: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: DELETE_APPLICATION_ACTION,
      payload: { applicationId }
    });
  };
};
