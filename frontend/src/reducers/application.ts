import { k8sToKalmNamespace } from "api/transformers";
import produce from "immer";
import { Actions } from "types";
import { ApplicationDetails, SET_IS_SUBMITTING_APPLICATION } from "types/application";
import { LOGOUT } from "types/common";

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
  isListFirstLoaded: true,
  isItemLoading: false,
  isSubmittingApplication: false,
};

const reducer = produce((state: State, action: Actions) => {
  // @ts-ignore
  if (!action.payload || !action.payload || action.payload.kind !== "Namespace") {
    return state;
  }

  switch (action.type) {
    case "ADDED": {
      const index = state.applications.findIndex((x) => x.name === action.payload.metadata.name);

      if (index >= 0) {
        state.applications[index] = k8sToKalmNamespace(action.payload);
      } else {
        state.applications.push(k8sToKalmNamespace(action.payload));
      }

      return state;
    }
    case "DELETED": {
      const index = state.applications.findIndex((x) => x.name === action.payload.metadata.name);

      if (index >= 0) {
        delete state.applications[index];
      }
      return state;
    }
    case "MODIFIED": {
      const index = state.applications.findIndex((x) => x.name === action.payload.metadata.name);

      if (index >= 0) {
        state.applications[index] = k8sToKalmNamespace(action.payload);
      }
      return state;
    }
  }

  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case SET_IS_SUBMITTING_APPLICATION: {
      state.isSubmittingApplication = action.payload.isSubmittingApplication;
      return;
    }
  }

  return;
}, initialState);

export default reducer;
