import Immutable from "immutable";
import { LOGOUT } from "types/common";
import { Actions } from "../types";
import {
  ApplicationComponentDetails,
  ApplicationDetails,
  ComponentPlugin,
  CREATE_APPLICATION,
  CREATE_COMPONENT,
  DELETE_APPLICATION,
  DELETE_COMPONENT,
  DUPLICATE_APPLICATION,
  LOAD_APPLICATIONS_FAILED,
  LOAD_APPLICATIONS_FULFILLED,
  LOAD_APPLICATIONS_PENDING,
  LOAD_APPLICATION_FAILED,
  LOAD_APPLICATION_FULFILLED,
  LOAD_APPLICATION_PENDING,
  LOAD_COMPONENT_PLUGINS_FULFILLED,
  SET_IS_SUBMITTING_APPLICATION,
  SET_IS_SUBMITTING_APPLICATION_COMPONENT,
  UPDATE_APPLICATION,
  UPDATE_COMPONENT
} from "../types/application";
import { ImmutableMap } from "../typings";

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
  isListLoading: false,
  isListFirstLoaded: false,
  isItemLoading: false,
  isSubmittingApplication: false,
  isSubmittingApplicationComponent: false,
  // applicationPlugins: [],
  componentPlugins: []
});

const putApplicationIntoState = (state: State, application: ApplicationDetails): State => {
  const applications = state.get("applications");
  const index = applications.findIndex(app => app.get("name") === application.get("name"));

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
  component: ApplicationComponentDetails
): State => {
  const applications = state.get("applications");
  const applicationIndex = applications.findIndex(app => app.get("name") === applicationName);
  if (applicationIndex < 0) {
    return state;
  }

  const application = applications.find(app => app.get("name") === applicationName);
  const componentIndex = application!.get("components").findIndex(c => c.get("name") === component.get("name"));
  if (componentIndex < 0) {
    state = state.setIn(["applications", applicationIndex, 0], component);
  } else {
    state = state.setIn(["applications", applicationIndex, componentIndex], component);
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
      const index = applications.findIndex(app => app.get("name") === action.payload.applicationName);

      if (index >= 0) {
        state = state.deleteIn(["applications", index]);
      }

      break;
    }
    case CREATE_COMPONENT: {
      state = putComponentIntoState(state, action.payload.applicationName, action.payload.component);
      break;
    }
    case UPDATE_COMPONENT: {
      state = putComponentIntoState(state, action.payload.applicationName, action.payload.component);
      break;
    }
    case DELETE_COMPONENT: {
      const applications = state.get("applications");
      const applicationIndex = applications.findIndex(app => app.get("name") === action.payload.applicationName);
      if (applicationIndex < 0) {
        break;
      }

      const application = applications.find(app => app.get("name") === action.payload.applicationName);
      const componentIndex = application!
        .get("components")
        .findIndex(c => c.get("name") === action.payload.componentName);
      if (componentIndex < 0) {
        break;
      }

      state = state.deleteIn(["applications", applicationIndex, componentIndex]);
      break;
    }
    // case LOAD_APPLICATION_PLUGINS_FULFILLED: {
    //   state = state.set("applicationPlugins", action.payload.applicationPlugins);

    //   break;
    // }
    case LOAD_COMPONENT_PLUGINS_FULFILLED: {
      state = state.set("componentPlugins", action.payload.componentPlugins);

      break;
    }
  }

  return state;
};

export default reducer;
