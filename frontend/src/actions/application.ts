import { api } from "api";
import { push } from "connected-react-router";
import { ThunkResult } from "types";
import {
  Application,
  ApplicationComponentDetails,
  ApplicationDetails,
  CREATE_APPLICATION,
  DELETE_APPLICATION,
  LOAD_ALL_NAMESAPCES_COMPONETS,
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
  UPDATE_APPLICATION,
} from "types/application";
import { setCurrentNamespaceAction } from "./namespaces";
import { setSuccessNotificationAction } from "./notification";

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
    dispatch(setSuccessNotificationAction("Create application successfully"));
    return application;
  };
};

export const updateApplicationAction = (applicationRaw: Application): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    // const testErrors = [
    //   {
    //     key: ".name",
    //     message: "name errors"
    //   },
    //   {
    //     key: ".components[1].name",
    //     message: "components name errors"
    //   },
    //   {
    //     key: ".components[1].ports",
    //     message: "components ports errors"
    //   }
    // ];
    // const submitErrors = resErrorsToSubmitErrors(testErrors);
    // console.log("throw", submitErrors);
    // throw new SubmissionError(submitErrors);

    dispatch(setIsSubmittingApplicationAction(true));

    let application: ApplicationDetails;

    try {
      application = await api.updateApplication(applicationRaw);
    } catch (e) {
      dispatch(setIsSubmittingApplicationAction(false));
      throw e;
    }

    dispatch(setIsSubmittingApplicationAction(false));

    dispatch({
      type: UPDATE_APPLICATION,
      payload: { application },
    });
    dispatch(setSuccessNotificationAction("Edit application successfully"));
    dispatch(push("/applications"));
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

export const loadApplicationAction = (name: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_APPLICATION_PENDING });

    let application: ApplicationDetails;
    try {
      application = await api.getApplication(name);
    } catch (e) {
      dispatch({ type: LOAD_APPLICATION_FAILED });
      throw e;
    }

    dispatch({
      type: LOAD_APPLICATION_FULFILLED,
      payload: {
        application,
      },
    });
  };
};

export const loadApplicationsAction = (): ThunkResult<Promise<ApplicationDetails[]>> => {
  return async (dispatch, getState) => {
    dispatch({ type: LOAD_APPLICATIONS_PENDING });

    let applicationList: ApplicationDetails[];
    // keep consistency, in application list page need pods info in components
    let allNamespacesComponents: { [key: string]: ApplicationComponentDetails[] } = {};
    try {
      applicationList = await api.getApplicationList();

      await Promise.all(
        applicationList
          .filter((app) => app.status === "Active")
          .map(async (app) => {
            const components = await api.getApplicationComponentList(app.name);
            allNamespacesComponents[app.name] = components;
          }),
      );
    } catch (e) {
      dispatch({ type: LOAD_APPLICATIONS_FAILED });
      throw e;
    }

    const activeNamespace = getState().namespaces.active;
    const firstNamespace = applicationList[0];
    if (!activeNamespace && applicationList.length > 0 && firstNamespace != null) {
      dispatch(setCurrentNamespaceAction(firstNamespace?.name, false));
    }

    dispatch({
      type: LOAD_ALL_NAMESAPCES_COMPONETS,
      payload: {
        components: allNamespacesComponents,
      },
    });

    dispatch({
      type: LOAD_APPLICATIONS_FULFILLED,
      payload: {
        applicationList,
      },
    });

    return applicationList;
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
