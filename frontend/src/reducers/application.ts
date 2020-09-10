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
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_APPLICATION,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import { addOrUpdateInArray, removeInArrayByName, isInArray, removeInArray } from "./utils";
import produce from "immer";

export type State = {
  applications: ApplicationDetails[];
  isListLoading: boolean;
  isListFirstLoaded: boolean;
  isItemLoading: boolean;
  isSubmittingApplication: boolean;
};

const initialState: State = {
  applications: [],
  isListLoading: false,
  isListFirstLoaded: false,
  isItemLoading: false,
  isSubmittingApplication: false,
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case SET_IS_SUBMITTING_APPLICATION: {
      state.isSubmittingApplication = action.payload.isSubmittingApplication;
      return;
    }
    case LOAD_APPLICATIONS_PENDING: {
      state.isListLoading = true;
      return;
    }
    case LOAD_APPLICATIONS_FAILED: {
      state.isListLoading = false;
      return;
    }
    case LOAD_APPLICATIONS_FULFILLED: {
      state.isListFirstLoaded = true;
      state.isListLoading = false;
      state.applications = action.payload.applicationList;
      return;
    }
    case LOAD_APPLICATION_PENDING: {
      state.isItemLoading = true;
      return;
    }
    case LOAD_APPLICATION_FAILED: {
      state.isItemLoading = false;
      return;
    }
    case LOAD_APPLICATION_FULFILLED: {
      state.isItemLoading = false;
      state.applications = addOrUpdateInArray(state.applications, action.payload.application);
      return;
    }
    case CREATE_APPLICATION: {
      state.applications = addOrUpdateInArray(state.applications, action.payload.application);
      return;
    }
    case UPDATE_APPLICATION: {
      state.applications = addOrUpdateInArray(state.applications, action.payload.application);
      return;
    }
    case DELETE_APPLICATION: {
      state.applications = removeInArrayByName(state.applications, action.payload.applicationName);
      return;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_APPLICATION) {
        return;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          if (action.payload.data.status === "Active" && !isInArray(state.applications, action.payload.data)) {
            state.applications = addOrUpdateInArray(state.applications, action.payload.data, false);
          }
          return;
        }
        case RESOURCE_ACTION_DELETE: {
          state.applications = removeInArray(state.applications, action.payload.data);
          return;
        }
        case RESOURCE_ACTION_UPDATE: {
          if (action.payload.data.status === "Terminating") {
            state.applications = removeInArray(state.applications, action.payload.data);
            return;
          }
          state.applications = addOrUpdateInArray(state.applications, action.payload.data);
          return;
        }
        default:
          return;
      }
    }
  }

  return;
}, initialState);

export default reducer;
