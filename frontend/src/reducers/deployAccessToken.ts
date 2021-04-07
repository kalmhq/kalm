import produce from "immer";
import { addOrUpdateInArray, removeInArray } from "reducers/utils";
import { Actions } from "types";
import { LOGOUT } from "types/common";
import {
  DeployAccessToken,
  LOAD_DEPLOY_ACCESS_TOKENS_FAILED,
  LOAD_DEPLOY_ACCESS_TOKENS_FULFILLED,
  LOAD_DEPLOY_ACCESS_TOKENS_PENDING,
} from "types/deployAccessToken";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_DEPLOY_ACCESS_TOKEN,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";

interface State {
  isLoading: boolean;
  loaded: boolean;
  deployAccessTokens: DeployAccessToken[];
}

const initialState: State = {
  isLoading: false,
  loaded: false,
  deployAccessTokens: [],
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_DEPLOY_ACCESS_TOKENS_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_DEPLOY_ACCESS_TOKENS_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_DEPLOY_ACCESS_TOKENS_FULFILLED: {
      state.isLoading = false;
      state.loaded = true;
      state.deployAccessTokens = action.payload;
      return;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_DEPLOY_ACCESS_TOKEN) {
        return state;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state.deployAccessTokens = addOrUpdateInArray(state.deployAccessTokens, action.payload.data);
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state.deployAccessTokens = removeInArray(state.deployAccessTokens, action.payload.data);
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state.deployAccessTokens = addOrUpdateInArray(state.deployAccessTokens, action.payload.data);
          break;
        }
      }

      break;
    }
  }

  return;
}, initialState);

export default reducer;
