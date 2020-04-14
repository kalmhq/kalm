import { StatusFailure, ThunkResult } from "../types";
import {
  Application,
  ApplicationDetails,
  ApplicationDetailsList,
  CREATE_APPLICATION,
  DELETE_APPLICATION,
  DUPLICATE_APPLICATION,
  LOAD_APPLICATIONS_FAILED,
  LOAD_APPLICATIONS_FULFILLED,
  LOAD_APPLICATIONS_PENDING,
  LOAD_APPLICATION_FAILED,
  LOAD_APPLICATION_FULFILLED,
  LOAD_APPLICATION_PENDING,
  SetIsSubmittingApplication,
  SetIsSubmittingApplicationComponent,
  SET_IS_SUBMITTING_APPLICATION,
  SET_IS_SUBMITTING_APPLICATION_COMPONENT,
  UPDATE_APPLICATION
} from "../types/application";
import {
  createKappApplication,
  deleteKappApplication,
  getKappApplication,
  getKappApplicationList,
  updateKappApplication
} from "./kubernetesApi";
import { setErrorNotificationAction, setSuccessNotificationAction } from "./notification";
// import { SubmissionError } from "redux-form";
import { push } from "connected-react-router";

export const createApplicationAction = (applicationValues: Application): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch(setIsSubmittingApplication(true));
    let application: ApplicationDetails;

    try {
      application = await createKappApplication(applicationValues);
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      // throw new SubmissionError({
      //   name: "User does not exist"
      // });
      return;
    } finally {
      setTimeout(() => {
        dispatch(setIsSubmittingApplication(false));
      }, 2000);
    }

    dispatch(loadApplicationsAction());
    dispatch({
      type: CREATE_APPLICATION,
      payload: { application }
    });
    dispatch(setSuccessNotificationAction("Create application successfully"));
    dispatch(push("/applications"));
  };
};

export const updateApplicationAction = (applicationRaw: Application): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch(setIsSubmittingApplication(true));
    let application: ApplicationDetails;

    try {
      application = await updateKappApplication(applicationRaw);
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    } finally {
      setTimeout(() => {
        dispatch(setIsSubmittingApplication(false));
      }, 2000);
    }

    dispatch(loadApplicationsAction());
    dispatch({
      type: UPDATE_APPLICATION,
      payload: { application }
    });
    dispatch(setSuccessNotificationAction("Edit application successfully"));
    dispatch(push("/applications"));
  };
};

export const duplicateApplicationAction = (duplicatedApplication: Application): ThunkResult<Promise<void>> => {
  return async dispatch => {
    let application: ApplicationDetails;
    try {
      application = await createKappApplication(duplicatedApplication);
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
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
      if (e.response && e.response.data.status === StatusFailure) {
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

    let application: ApplicationDetails;
    try {
      application = await getKappApplication(namespace, name);
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
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
        application
      }
    });
  };
};

export const loadApplicationsAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    const activeNamespace = getState()
      .get("namespaces")
      .get("active");
    dispatch({ type: LOAD_APPLICATIONS_PENDING });

    let applicationList: ApplicationDetailsList;
    try {
      applicationList = await getKappApplicationList(activeNamespace);

      // if the namespace is changed, return
      if (
        getState()
          .get("namespaces")
          .get("active") !== activeNamespace
      ) {
        return;
      }
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
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

export const setIsSubmittingApplication = (isSubmittingApplication: boolean): SetIsSubmittingApplication => {
  return {
    type: SET_IS_SUBMITTING_APPLICATION,
    payload: {
      isSubmittingApplication
    }
  };
};

export const setIsSubmittingApplicationComponent = (
  isSubmittingApplicationComponent: boolean
): SetIsSubmittingApplicationComponent => {
  return {
    type: SET_IS_SUBMITTING_APPLICATION_COMPONENT,
    payload: {
      isSubmittingApplicationComponent
    }
  };
};
