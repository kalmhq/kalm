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

    dispatch(loadApplicationsAction());
    dispatch({
      type: CREATE_APPLICATION,
      payload: { application }
    });
  };
};

export const updateApplicationAction = (applicationRaw: Application): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const application = await updateKappApplication(applicationRaw);

    dispatch(loadApplicationsAction());
    dispatch({
      type: UPDATE_APPLICATION,
      payload: { application }
    });
  };
};

export const duplicateApplicationAction = (namespace: string, applicationName: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    await dispatch(loadApplicationAction(namespace, applicationName));

    const duplicatedApplication = duplicateApplication(getApplicationByName(applicationName));
    const application = await createKappApplication(duplicatedApplication);

    dispatch(loadApplicationsAction());
    dispatch({
      type: DUPLICATE_APPLICATION,
      payload: { application }
    });
  };
};

export const deleteApplicationAction = (namespace: string, name: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    await deleteKappApplication(namespace, name);

    dispatch({
      type: DELETE_APPLICATION,
      payload: { applicationName: name }
    });
  };
};

export const loadApplicationAction = (namespace: string, name: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_APPLICATION_PENDING });

    const res = await getKappApplication(namespace, name);
    // console.log("applicationList", JSON.stringify(applicationList.toJS()));
    dispatch({
      type: LOAD_APPLICATION_FULFILLED,
      payload: {
        application: res.get("application"),
        podNames: res.get("podNames")
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
