import { Actions } from "types";
import { LOGOUT } from "types/common";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_DEPLOY_KEY,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import {
  DeployKey,
  LOAD_DEPLOY_KEYS_FAILED,
  LOAD_DEPLOY_KEYS_FULFILLED,
  LOAD_DEPLOY_KEYS_PENDING,
} from "types/deployKey";
import { addOrUpdateInArray, removeInArray } from "reducers/utils";
import produce from "immer";

export interface State {
  isLoading: boolean;
  loaded: boolean;
  deployKeys: DeployKey[];
}

const initialState: State = {
  isLoading: false,
  loaded: false,
  deployKeys: [],
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_DEPLOY_KEYS_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_DEPLOY_KEYS_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_DEPLOY_KEYS_FULFILLED: {
      state.isLoading = false;
      state.loaded = true;
      state.deployKeys = action.payload;
      return;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_DEPLOY_KEY) {
        return state;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          console.log(action.payload.data);
          state.deployKeys = addOrUpdateInArray(state.deployKeys, action.payload.data);
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state.deployKeys = removeInArray(state.deployKeys, action.payload.data);
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state.deployKeys = addOrUpdateInArray(state.deployKeys, action.payload.data);
          break;
        }
      }

      break;
    }
  }

  return;
}, initialState);

export default reducer;
