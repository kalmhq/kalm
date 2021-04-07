import produce from "immer";
import { addOrUpdateInArray, removeInArray } from "reducers/utils";
import { Actions } from "types";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_SERVICE,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import { LOAD_SERVICES_FAILED, LOAD_SERVICES_FULFILLED, LOAD_SERVICES_PENDING, Service } from "types/service";

type State = {
  isLoading: boolean;
  isFirstLoaded: boolean;
  services: Service[];
};

const initialState: State = {
  isLoading: false,
  isFirstLoaded: false,
  services: [],
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOAD_SERVICES_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_SERVICES_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_SERVICES_FULFILLED: {
      state.isLoading = false;
      state.isFirstLoaded = true;
      state.services = action.payload.services;
      return;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_SERVICE) {
        return;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state.services = addOrUpdateInArray(state.services, action.payload.data);
          return;
        }
        case RESOURCE_ACTION_DELETE: {
          state.services = removeInArray(state.services, action.payload.data);
          return;
        }
        case RESOURCE_ACTION_UPDATE: {
          state.services = addOrUpdateInArray(state.services, action.payload.data);
          return;
        }
      }

      return;
    }
  }

  return state;
}, initialState);

export default reducer;
