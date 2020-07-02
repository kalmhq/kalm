import Immutable from "immutable";
import { Actions } from "types";
import {
  ApplicationDetails,
  CREATE_APPLICATION,
  DELETE_APPLICATION,
  DUPLICATE_APPLICATION,
  LOAD_APPLICATIONS_FAILED,
  LOAD_APPLICATIONS_FULFILLED,
  LOAD_APPLICATIONS_PENDING,
  LOAD_APPLICATION_FAILED,
  LOAD_APPLICATION_FULFILLED,
  LOAD_APPLICATION_PENDING,
  SET_IS_SUBMITTING_APPLICATION,
  UPDATE_APPLICATION,
} from "types/application";
import { LOGOUT } from "types/common";
import { ImmutableMap } from "typings";

export type State = ImmutableMap<{
  applications: Immutable.List<ApplicationDetails>;
  isListLoading: boolean;
  isListFirstLoaded: boolean;
  isItemLoading: boolean;
  isSubmittingApplication: boolean;
  // applicationPlugins: ApplicationPlugin[];
}>;

const initialState: State = Immutable.Map({
  applications: Immutable.List(),
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

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case SET_IS_SUBMITTING_APPLICATION: {
      state = state.set("isSubmittingApplication", action.payload.isSubmittingApplication);
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

    // case LOAD_APPLICATION_PLUGINS_FULFILLED: {
    //   state = state.set("applicationPlugins", action.payload.applicationPlugins);

    //   break;
    // }
  }

  return state;
};

export default reducer;
