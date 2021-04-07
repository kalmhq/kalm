import { produce } from "immer";
import { Actions } from "types";
import {
  CREATE_DOMAIN_FULFILLED,
  DELETE_DOMAIN_FULFILLED,
  Domain,
  LOAD_DOMAINS_FAILED,
  LOAD_DOMAINS_FULFILLED,
  LOAD_DOMAINS_PENDING,
} from "types/domains";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_DOMAIN,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import { addOrUpdateInArray, removeInArray, removeInArrayByName } from "./utils";

interface State {
  isLoading: boolean;
  isFirstLoaded: boolean;
  domains: Domain[];
}

const initialState: State = {
  isLoading: false,
  isFirstLoaded: false,
  domains: [],
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOAD_DOMAINS_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_DOMAINS_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_DOMAINS_FULFILLED: {
      state.isFirstLoaded = true;
      state.domains = action.payload.domains || [];
      return;
    }
    case DELETE_DOMAIN_FULFILLED: {
      state.domains = removeInArrayByName(state.domains, action.payload.name);
      return;
    }
    case CREATE_DOMAIN_FULFILLED: {
      state.domains = addOrUpdateInArray(state.domains, action.payload.domain);
      return;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_DOMAIN) {
        return;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state.domains = addOrUpdateInArray(state.domains, action.payload.data);
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state.domains = removeInArray(state.domains, action.payload.data);
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state.domains = addOrUpdateInArray(state.domains, action.payload.data);
          break;
        }
      }

      return;
    }
  }

  return;
}, initialState);

export default reducer;
