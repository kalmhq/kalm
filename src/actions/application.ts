import {
  CREATE_APPLICATION_ACTION,
  ApplicationFormValues,
  UPDATE_APPLICATION_ACTION,
  DELETE_APPLICATION_ACTION,
  ThunkResult
} from ".";

export const createApplicationAction = (
  applicationValues: ApplicationFormValues
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
  applicationValues: ApplicationFormValues
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: UPDATE_APPLICATION_ACTION,
      payload: { applicationId, applicationValues }
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
