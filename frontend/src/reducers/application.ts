import Immutable from "immutable";
import { LOGOUT } from "types/common";
import { Actions } from "types";
import {
  ApplicationComponentDetails,
  ApplicationDetails,
  ComponentPlugin,
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
  UPDATE_APPLICATION,
  UPDATE_COMPONENT,
  ServiceStatus,
  PodStatus,
  ADD_OR_UPDATE_SERVICE,
  DELETE_SERVICE,
  ADD_OR_UPDATE_POD,
  DELETE_POD,
} from "types/application";
import { ImmutableMap } from "typings";

export type State = ImmutableMap<{
  applications: Immutable.List<ApplicationDetails>;
  isListLoading: boolean;
  isListFirstLoaded: boolean;
  isItemLoading: boolean;
  isSubmittingApplication: boolean;
  isSubmittingApplicationComponent: boolean;
  // applicationPlugins: ApplicationPlugin[];
  componentPlugins: ComponentPlugin[];
}>;

const initialState: State = Immutable.Map({
  applications: Immutable.List(),
  deletingApplicationNames: Immutable.Map({}),
  isListLoading: false,
  isListFirstLoaded: false,
  isItemLoading: false,
  isSubmittingApplication: false,
  isSubmittingApplicationComponent: false,
  // applicationPlugins: [],
  componentPlugins: [],
});

const putApplicationIntoState = (state: State, application: ApplicationDetails): State => {
  const applications = state.get("applications");
  const index = applications.findIndex((app) => app.get("name") === application.get("name"));

  if (index < 0) {
    state = state.set("applications", applications.push(application));
  } else {
    state = state.setIn(["applications", index], application);
  }
  return state;
};

const putComponentIntoState = (
  state: State,
  applicationName: string,
  component: ApplicationComponentDetails,
  isCreate: boolean,
): State => {
  const applications = state.get("applications");
  const applicationIndex = applications.findIndex((app) => app.get("name") === applicationName);
  if (applicationIndex < 0) {
    return state;
  }
  const application = applications.find((app) => app.get("name") === applicationName);
  const components = application?.get("components");
  if (!components) {
    return state;
  }
  const componentIndex = components.findIndex((c) => c.get("name") === component.get("name"));
  if (componentIndex < 0) {
    if (isCreate) {
      state = state.setIn(["applications", applicationIndex, "components", components.size], component);
    }
  } else {
    state = state.setIn(["applications", applicationIndex, "components", componentIndex], component);
  }

  return state;
};

const putServiceIntoState = (
  state: State,
  applicationName: string,
  componentName: string,
  service: ServiceStatus,
): State => {
  const applications = state.get("applications");
  const applicationIndex = applications.findIndex((app) => app.get("name") === applicationName);
  if (applicationIndex < 0) {
    return state;
  }
  const application = applications.find((app) => app.get("name") === applicationName);
  const components = application?.get("components");
  if (!components) {
    return state;
  }
  const componentIndex = components.findIndex((c) => c.get("name") === componentName);
  if (componentIndex < 0) {
    return state;
  }
  const component = components.find((c) => c.get("name") === componentName);
  const services = component!.get("services");
  const serviceIndex = services.findIndex((s) => s.get("name") === service.get("name"));

  if (serviceIndex < 0) {
    state = state.setIn(
      ["applications", applicationIndex, "components", componentIndex, "services", services.size],
      service,
    );
  } else {
    state = state.setIn(
      ["applications", applicationIndex, "components", componentIndex, "services", serviceIndex],
      service,
    );
  }

  return state;
};

const putPodIntoState = (state: State, applicationName: string, componentName: string, pod: PodStatus): State => {
  const applications = state.get("applications");
  const applicationIndex = applications.findIndex((app) => app.get("name") === applicationName);
  if (applicationIndex < 0) {
    return state;
  }
  const application = applications.find((app) => app.get("name") === applicationName);
  const components = application?.get("components");
  if (!components) {
    return state;
  }
  const componentIndex = components.findIndex((c) => c.get("name") === componentName);
  if (componentIndex < 0) {
    return state;
  }
  const component = components.find((c) => c.get("name") === componentName);
  const pods = component!.get("pods");
  const podIndex = pods.findIndex((s) => s.get("name") === pod.get("name"));

  if (podIndex < 0) {
    state = state.setIn(["applications", applicationIndex, "components", componentIndex, "pods", pods.size], pod);
  } else {
    state = state.setIn(["applications", applicationIndex, "components", componentIndex, "pods", podIndex], pod);
  }

  return state;
};

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case SET_IS_SUBMITTING_APPLICATION: {
      state = state.set("isSubmittingApplication", action.payload.isSubmittingApplication);
      break;
    }
    case SET_IS_SUBMITTING_APPLICATION_COMPONENT: {
      state = state.set("isSubmittingApplicationComponent", action.payload.isSubmittingApplicationComponent);
      break;
    }
    case LOAD_APPLICATIONS_PENDING: {
      state = state.set("isListLoading", true);
      break;
    }
    case LOAD_APPLICATIONS_FAILED: {
      state = state.set("isListLoading", false);
      break;
    }
    case LOAD_APPLICATIONS_FULFILLED: {
      state = state.set("isListFirstLoaded", true).set("isListLoading", false);
      state = state.set("applications", action.payload.applicationList);

      break;
    }
    case LOAD_APPLICATION_PENDING: {
      state = state.set("isItemLoading", true);
      break;
    }
    case LOAD_APPLICATION_FAILED: {
      state = state.set("isItemLoading", false);
      break;
    }
    case LOAD_APPLICATION_FULFILLED: {
      state = state.set("isItemLoading", false);
      state = putApplicationIntoState(state, action.payload.application);
      break;
    }
    case CREATE_APPLICATION: {
      state = putApplicationIntoState(state, action.payload.application);
      break;
    }
    case DUPLICATE_APPLICATION: {
      state = putApplicationIntoState(state, action.payload.application);
      break;
    }
    case UPDATE_APPLICATION: {
      state = putApplicationIntoState(state, action.payload.application);
      break;
    }
    case DELETE_APPLICATION: {
      const applications = state.get("applications");
      const index = applications.findIndex((app) => app.get("name") === action.payload.applicationName);

      if (index >= 0) {
        state = state.deleteIn(["applications", index]);
      }

      break;
    }
    case CREATE_COMPONENT: {
      state = putComponentIntoState(state, action.payload.applicationName, action.payload.component, true);
      break;
    }
    case UPDATE_COMPONENT: {
      state = putComponentIntoState(state, action.payload.applicationName, action.payload.component, false);
      break;
    }
    case DELETE_COMPONENT: {
      const applications = state.get("applications");
      const applicationIndex = applications.findIndex((app) => app.get("name") === action.payload.applicationName);
      if (applicationIndex < 0) {
        break;
      }
      const application = applications.find((app) => app.get("name") === action.payload.applicationName);
      const componentIndex = application!
        .get("components")
        .findIndex((c) => c.get("name") === action.payload.componentName);
      if (componentIndex < 0) {
        break;
      }

      state = state.deleteIn(["applications", applicationIndex, "components", componentIndex]);
      break;
    }
    case ADD_OR_UPDATE_SERVICE: {
      state = putServiceIntoState(
        state,
        action.payload.applicationName,
        action.payload.componentName,
        action.payload.service,
      );
      break;
    }
    case DELETE_SERVICE: {
      const { applicationName, componentName, serviceName } = action.payload;
      const applications = state.get("applications");
      const applicationIndex = applications.findIndex((app) => app.get("name") === applicationName);
      if (applicationIndex < 0) {
        return state;
      }
      const application = applications.find((app) => app.get("name") === applicationName);
      const components = application?.get("components");
      if (!components) {
        return state;
      }
      const componentIndex = components.findIndex((c) => c.get("name") === componentName);
      if (componentIndex < 0) {
        return state;
      }
      const component = components.find((c) => c.get("name") === componentName);
      const serviceIndex = component!.get("services").findIndex((s) => s.get("name") === serviceName);

      state = state.deleteIn([
        "applications",
        applicationIndex,
        "components",
        componentIndex,
        "services",
        serviceIndex,
      ]);
      break;
    }
    case ADD_OR_UPDATE_POD: {
      state = putPodIntoState(state, action.payload.applicationName, action.payload.componentName, action.payload.pod);
      break;
    }
    case DELETE_POD: {
      const { applicationName, componentName, podName } = action.payload;
      const applications = state.get("applications");
      const applicationIndex = applications.findIndex((app) => app.get("name") === applicationName);
      if (applicationIndex < 0) {
        return state;
      }
      const application = applications.find((app) => app.get("name") === applicationName);
      const components = application?.get("components");
      if (!components) {
        return state;
      }
      const componentIndex = components.findIndex((c) => c.get("name") === componentName);
      if (componentIndex < 0) {
        return state;
      }
      const component = components.find((c) => c.get("name") === componentName);
      const podIndex = component!.get("pods").findIndex((s) => s.get("name") === podName);

      state = state.deleteIn(["applications", applicationIndex, "components", componentIndex, "pods", podIndex]);
      break;
    }
    case LOAD_COMPONENT_PLUGINS_FULFILLED: {
      state = state.set("componentPlugins", action.payload.componentPlugins);

      break;
    }
    // case LOAD_APPLICATION_PLUGINS_FULFILLED: {
    //   state = state.set("applicationPlugins", action.payload.applicationPlugins);

    //   break;
    // }
  }

  return state;
};

export default reducer;
