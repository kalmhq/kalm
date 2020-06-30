import { push } from "connected-react-router";
import Immutable from "immutable";
import { SubmissionError } from "redux-form";
import { ThunkResult } from "../types";
import {
  Application,
  ApplicationComponent,
  ApplicationComponentDetails,
  ApplicationDetails,
  CREATE_APPLICATION,
  CREATE_COMPONENT,
  DELETE_APPLICATION,
  DELETE_COMPONENT,
  DUPLICATE_APPLICATION,
  LOAD_APPLICATION_FAILED,
  LOAD_APPLICATION_FULFILLED,
  LOAD_APPLICATION_PENDING,
  LOAD_APPLICATIONS_FAILED,
  LOAD_APPLICATIONS_FULFILLED,
  LOAD_APPLICATIONS_PENDING,
  LOAD_COMPONENT_PLUGINS_FULFILLED,
  SET_IS_SUBMITTING_APPLICATION,
  SET_IS_SUBMITTING_APPLICATION_COMPONENT,
  SetIsSubmittingApplication,
  SetIsSubmittingApplicationComponent,
  UPDATE_APPLICATION,
  UPDATE_COMPONENT,
} from "../types/application";
import { resErrorsToSubmitErrors } from "../utils";
import { setCurrentNamespaceAction } from "./namespaces";
import { setSuccessNotificationAction } from "./notification";
import { api } from "api";
import { VolumeTypePersistentVolumeClaimNew, VolumeTypePersistentVolumeClaim } from "../types/componentTemplate";
import { getComponentFormVolumeOptions } from "../selectors/component";

const correctComponentFormValues = (componentValues: ApplicationComponent): ApplicationComponent => {
  const volumes = componentValues.get("volumes");

  const volumeOptions = getComponentFormVolumeOptions(componentValues.get("name"), componentValues.get("workloadType"));

  const findPVToMatch = (pvc: string): string => {
    let pvToMatch = "";

    volumeOptions.forEach((vo) => {
      if (vo.get("pvc") === pvc) {
        pvToMatch = vo.get("pvToMatch");
      }
    });

    return pvToMatch;
  };

  const correctedVolumes = volumes?.map((v) => {
    // set pvToMatch
    if (v.get("type") === VolumeTypePersistentVolumeClaim) {
      v = v.set("pvToMatch", findPVToMatch(v.get("pvc")));
    }
    // if is pvc-new, set to pvc
    if (v.get("type") === VolumeTypePersistentVolumeClaimNew) {
      v = v.set("type", VolumeTypePersistentVolumeClaim);
    }
    return v;
  });

  return componentValues.set("volumes", correctedVolumes);
};

export const createComponentAction = (
  componentValues: ApplicationComponent,
  applicationName?: string,
): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    if (!applicationName) {
      applicationName = getState().get("namespaces").get("active");
    }
    dispatch(setIsSubmittingApplicationComponent(true));

    let component: ApplicationComponentDetails;
    try {
      component = await api.createKappApplicationComponent(
        applicationName,
        correctComponentFormValues(componentValues),
      );
    } catch (e) {
      dispatch(setIsSubmittingApplicationComponent(false));
      throw e;
    }

    dispatch(setIsSubmittingApplicationComponent(false));

    // dispatch(loadApplicationAction(applicationName));
    await dispatch({
      type: CREATE_COMPONENT,
      payload: { applicationName, component },
    });
    dispatch(setSuccessNotificationAction("Create component successfully"));
  };
};

export const updateComponentAction = (
  componentValues: ApplicationComponent,
  applicationName?: string,
): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    if (!applicationName) {
      applicationName = getState().get("namespaces").get("active");
    }

    dispatch(setIsSubmittingApplicationComponent(true));

    let component: ApplicationComponentDetails;
    try {
      component = await api.updateKappApplicationComponent(
        applicationName,
        correctComponentFormValues(componentValues),
      );
    } catch (e) {
      dispatch(setIsSubmittingApplicationComponent(false));
      throw e;
    }
    dispatch(setIsSubmittingApplicationComponent(false));

    // dispatch(loadApplicationAction(applicationName));
    await dispatch({
      type: UPDATE_COMPONENT,
      payload: { applicationName, component },
    });
    dispatch(setSuccessNotificationAction("Update component successfully"));
  };
};

export const deleteComponentAction = (componentName: string, applicationName?: string): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    if (!applicationName) {
      applicationName = getState().get("namespaces").get("active");
    }

    await api.deleteKappApplicationComponent(applicationName, componentName);

    // dispatch(loadApplicationAction(applicationName));
    dispatch({
      type: DELETE_COMPONENT,
      payload: { applicationName, componentName },
    });
    dispatch(setSuccessNotificationAction("Delete component successfully"));
  };
};

export const createApplicationAction = (applicationValues: Application): ThunkResult<Promise<Application>> => {
  return async (dispatch) => {
    dispatch(setIsSubmittingApplication(true));

    let application: ApplicationDetails;

    try {
      application = await api.createKappApplication(applicationValues);
    } catch (e) {
      dispatch(setIsSubmittingApplication(false));

      if (e.response && e.response.data.errors && e.response.data.errors.length > 0) {
        const submitErrors = resErrorsToSubmitErrors(e.response.data.errors);
        throw new SubmissionError(submitErrors);
      }
      throw e;
    }

    dispatch(setIsSubmittingApplication(false));

    // dispatch(loadApplicationsAction());
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

    dispatch(setIsSubmittingApplication(true));

    let application: ApplicationDetails;

    try {
      application = await api.updateKappApplication(applicationRaw);
    } catch (e) {
      dispatch(setIsSubmittingApplication(false));
      if (e.response && e.response.data.errors && e.response.data.errors.length > 0) {
        const submitErrors = resErrorsToSubmitErrors(e.response.data.errors);
        throw new SubmissionError(submitErrors);
      }
      throw e;
    }

    dispatch(setIsSubmittingApplication(false));

    // dispatch(loadApplicationsAction());
    dispatch({
      type: UPDATE_APPLICATION,
      payload: { application },
    });
    dispatch(setSuccessNotificationAction("Edit application successfully"));
    dispatch(push("/applications"));
  };
};

export const duplicateApplicationAction = (duplicatedApplication: Application): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    let application: ApplicationDetails;
    application = await api.createKappApplication(duplicatedApplication);

    // dispatch(loadApplicationsAction());
    dispatch({
      type: DUPLICATE_APPLICATION,
      payload: { application },
    });
  };
};

export const deleteApplicationAction = (name: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    await api.deleteKappApplication(name);

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
      application = await api.getKappApplication(name);
      const applicationComponents = await api.getKappApplicationComponentList(application.get("name"));
      application = application.set("components", applicationComponents);
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

export const loadApplicationsAction = (): ThunkResult<Promise<Immutable.List<ApplicationDetails>>> => {
  return async (dispatch, getState) => {
    dispatch({ type: LOAD_APPLICATIONS_PENDING });

    let applicationList: Immutable.List<ApplicationDetails>;
    try {
      applicationList = await api.getKappApplicationList();

      applicationList = Immutable.List(
        await Promise.all(
          applicationList
            .filter((app) => app.get("status") === "Active")
            .map(async (application) => {
              const components = await api.getKappApplicationComponentList(application.get("name"));
              application = application.set("components", components);
              return application;
            }),
        ),
      );
    } catch (e) {
      dispatch({ type: LOAD_APPLICATIONS_FAILED });
      throw e;
    }

    const activeNamespace = getState().get("namespaces").get("active");
    const firstNamespace = applicationList.get(0);
    if (!activeNamespace && applicationList.size > 0 && firstNamespace != null) {
      dispatch(setCurrentNamespaceAction(firstNamespace?.get("name"), false));
    }

    dispatch({
      type: LOAD_APPLICATIONS_FULFILLED,
      payload: {
        applicationList,
      },
    });

    return applicationList;
  };
};

// export const loadApplicationPluginsAction = (): ThunkResult<Promise<void>> => {
//   return async dispatch => {
//     let applicationPlugins;
//     try {
//       applicationPlugins = await getKappApplicationPlugins();
//     } catch (e) {
//       if (e.response && e.response.data.status === StatusFailure) {
//         dispatch(setErrorNotificationAction(e.response.data.message));
//       } else {
//         dispatch(setErrorNotificationAction());
//       }
//       return;
//     }

//     dispatch({
//       type: LOAD_APPLICATION_PLUGINS_FULFILLED,
//       payload: {
//         applicationPlugins
//       }
//     });
//   };
// };

export const loadComponentPluginsAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    let componentPlugins = await api.getKappComponentPlugins();

    dispatch({
      type: LOAD_COMPONENT_PLUGINS_FULFILLED,
      payload: {
        componentPlugins,
      },
    });
  };
};

export const setIsSubmittingApplication = (isSubmittingApplication: boolean): SetIsSubmittingApplication => {
  return {
    type: SET_IS_SUBMITTING_APPLICATION,
    payload: {
      isSubmittingApplication,
    },
  };
};

export const setIsSubmittingApplicationComponent = (
  isSubmittingApplicationComponent: boolean,
): SetIsSubmittingApplicationComponent => {
  return {
    type: SET_IS_SUBMITTING_APPLICATION_COMPONENT,
    payload: {
      isSubmittingApplicationComponent,
    },
  };
};
