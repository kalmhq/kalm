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
import {
  getKappApplications,
  updateKappApplication,
  createKappApplication,
  deleteKappApplication
} from "./kubernetesApi";
import { convertToCRDApplication } from "../convertors/Application";
import { getApplicationById, duplicateApplication } from "../selectors/application";

export const createApplicationAction = (applicationValues: Application): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const application = await createKappApplication(convertToCRDApplication(applicationValues));

    dispatch({
      type: CREATE_APPLICATION,
      payload: { application }
    });
  };
};

export const updateApplicationAction = (
  applicationId: string,
  applicationRaw: Application
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const application = await updateKappApplication(convertToCRDApplication(applicationRaw));

    dispatch({
      type: UPDATE_APPLICATION,
      payload: { application }
    });
  };
};

export const duplicateApplicationAction = (applicationId: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const duplicatedApplication = duplicateApplication(getApplicationById(applicationId));
    const application = await createKappApplication(convertToCRDApplication(duplicatedApplication));

    dispatch({
      type: DUPLICATE_APPLICATION,
      payload: { application }
    });
  };
};

export const deleteApplicationAction = (applicationId: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const application = getApplicationById(applicationId);
    await deleteKappApplication(convertToCRDApplication(application));

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
