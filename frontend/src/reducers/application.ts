import Immutable from "immutable";
import { Actions } from "types";
import {
  ApplicationDetails,
  CREATE_APPLICATION,
  DELETE_APPLICATION,
  LOAD_APPLICATION_FAILED,
  LOAD_APPLICATION_FULFILLED,
  LOAD_APPLICATION_PENDING,
  LOAD_APPLICATIONS_FAILED,
  LOAD_APPLICATIONS_FULFILLED,
  LOAD_APPLICATIONS_PENDING,
  SET_IS_SUBMITTING_APPLICATION,
  UPDATE_APPLICATION,
} from "types/application";
import { LOGOUT } from "types/common";
import { ImmutableMap } from "typings";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_APPLICATION,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import { addOrUpdateInList, removeInList, removeInListByName } from "./utils";

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
      state = state.update("applications", (x) => addOrUpdateInList(x, action.payload.application));
      break;
    }
    case CREATE_APPLICATION: {
      state = state.update("applications", (x) => addOrUpdateInList(x, action.payload.application));
      break;
    }
    case UPDATE_APPLICATION: {
      state = state.update("applications", (x) => addOrUpdateInList(x, action.payload.application));
      break;
    }
    case DELETE_APPLICATION: {
      state = state.update("applications", (x) => removeInListByName(x, action.payload.applicationName));
      break;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_APPLICATION) {
        break;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          if (action.payload.data.get("status") === "Active") {
            state = state.update("applications", (x) => addOrUpdateInList(x, action.payload.data, false));
          }
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state = state.update("applications", (x) => removeInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          if (action.payload.data.get("status") === "Terminating") {
            state = state.update("applications", (x) => removeInList(x, action.payload.data));
            break;
          }

          state = state.update("applications", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
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
