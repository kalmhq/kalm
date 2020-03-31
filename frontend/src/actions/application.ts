import {
  updateKappApplication,
  createKappApplication,
  deleteKappApplication,
  getKappApplicationList,
  getKappApplication
} from "./kubernetesApi";
import {
  LOAD_APPLICATIONS_PENDING,
  LOAD_APPLICATIONS_FULFILLED,
  DELETE_APPLICATION,
  DUPLICATE_APPLICATION,
  UPDATE_APPLICATION,
  Application,
  CREATE_APPLICATION,
  LOAD_APPLICATION_PENDING,
  LOAD_APPLICATION_FULFILLED,
  LOAD_APPLICATION_FAILED,
  LOAD_APPLICATIONS_FAILED
} from "../types/application";
import { ThunkResult, StatusFailure } from "../types";
import { setErrorNotificationAction } from "./notification";

export const createApplicationAction = (applicationValues: Application): ThunkResult<Promise<void>> => {
  return async dispatch => {
    let application: Application;
    try {
      application = await createKappApplication(applicationValues);
    } catch (e) {
      if (e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }

    dispatch(loadApplicationsAction());
    dispatch({
      type: CREATE_APPLICATION,
      payload: { application }
    });
  };
};

export const updateApplicationAction = (applicationRaw: Application): ThunkResult<Promise<void>> => {
  return async dispatch => {
    let application: Application;
    try {
      application = await updateKappApplication(applicationRaw);
    } catch (e) {
      if (e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }

    dispatch(loadApplicationsAction());
    dispatch({
      type: UPDATE_APPLICATION,
      payload: { application }
    });
  };
};

export const duplicateApplicationAction = (duplicatedApplication: Application): ThunkResult<Promise<void>> => {
  return async dispatch => {
    let application: Application;
    try {
      application = await createKappApplication(duplicatedApplication);
    } catch (e) {
      if (e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }

    dispatch(loadApplicationsAction());
    dispatch({
      type: DUPLICATE_APPLICATION,
      payload: { application }
    });
  };
};

export const deleteApplicationAction = (namespace: string, name: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    try {
      await deleteKappApplication(namespace, name);
    } catch (e) {
      if (e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }

    dispatch({
      type: DELETE_APPLICATION,
      payload: { applicationName: name }
    });
  };
};

export const loadApplicationAction = (namespace: string, name: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_APPLICATION_PENDING });

    let res;
    try {
      res = await getKappApplication(namespace, name);
    } catch (e) {
      if (e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: LOAD_APPLICATION_FAILED });
      return;
    }

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

    let applicationList;
    try {
      applicationList = await getKappApplicationList();
    } catch (e) {
      if (e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: LOAD_APPLICATIONS_FAILED });
      return;
    }

    // console.log("applicationList", JSON.stringify(applicationList.toJS()));
    dispatch({
      type: LOAD_APPLICATIONS_FULFILLED,
      payload: {
        applicationList
      }
    });
  };
};
