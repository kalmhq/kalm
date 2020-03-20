import {
  updateKappApplication,
  createKappApplication,
  deleteKappApplication,
  getKappApplicationList,
  getKappApplication
} from "./kubernetesApi";
import { getApplicationByName, duplicateApplication } from "../selectors/application";
import {
  LOAD_APPLICATIONS_PENDING,
  LOAD_APPLICATIONS_FULFILLED,
  DELETE_APPLICATION,
  DUPLICATE_APPLICATION,
  UPDATE_APPLICATION,
  Application,
  CREATE_APPLICATION,
  LOAD_APPLICATION_PENDING,
  LOAD_APPLICATION_FULFILLED
} from "../types/application";
import { ThunkResult } from "../types";

export const createApplicationAction = (applicationValues: Application): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const application = await createKappApplication(applicationValues);

    dispatch({
      type: CREATE_APPLICATION,
      payload: { application }
    });
  };
};

export const updateApplicationAction = (applicationRaw: Application): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const application = await updateKappApplication(applicationRaw);

    dispatch({
      type: UPDATE_APPLICATION,
      payload: { application }
    });
  };
};

export const duplicateApplicationAction = (applicationName: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const duplicatedApplication = duplicateApplication(getApplicationByName(applicationName));
    const application = await createKappApplication(duplicatedApplication);

    dispatch({
      type: DUPLICATE_APPLICATION,
      payload: { application }
    });
  };
};

export const deleteApplicationAction = (applicationName: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const application = getApplicationByName(applicationName);
    console.log("deleteApplicationAction", applicationName);
    await deleteKappApplication(application);

    dispatch({
      type: DELETE_APPLICATION,
      payload: { applicationName }
    });
  };
};

export const loadApplicationAction = (namespace: string, name: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_APPLICATION_PENDING });

    const application = await getKappApplication(namespace, name);
    // console.log("applicationList", JSON.stringify(applicationList.toJS()));
    dispatch({
      type: LOAD_APPLICATION_FULFILLED,
      payload: {
        application
      }
    });
  };
};

export const loadApplicationsAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_APPLICATIONS_PENDING });

    const applicationList = await getKappApplicationList();
    // console.log("applicationList", JSON.stringify(applicationList.toJS()));
    dispatch({
      type: LOAD_APPLICATIONS_FULFILLED,
      payload: {
        applicationList
      }
    });
  };
};
