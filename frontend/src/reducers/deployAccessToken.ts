import Immutable from "immutable";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import { LOGOUT } from "types/common";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_DEPLOY_ACCESS_TOKEN,
  WATCHED_RESOURCE_CHANGE
} from "types/resources";
import {
  DeployAccessToken,
  LOAD_DEPLOY_ACCESS_TOKENS_FAILED,
  LOAD_DEPLOY_ACCESS_TOKENS_FULFILLED,
  LOAD_DEPLOY_ACCESS_TOKENS_PENDING
} from "types/deployAccessToken";
import { addOrUpdateInList, removeInList } from "reducers/utils";

export type State = ImmutableMap<{
  isLoading: boolean;
  loaded: boolean;
  deployAccessTokens: Immutable.List<DeployAccessToken>;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  loaded: false,
  deployAccessTokens: Immutable.List(),
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_DEPLOY_ACCESS_TOKENS_PENDING: {
      return state.set("isLoading", true);
    }
    case LOAD_DEPLOY_ACCESS_TOKENS_FAILED: {
      return state.set("isLoading", false);
    }
    case LOAD_DEPLOY_ACCESS_TOKENS_FULFILLED: {
      return state.set("isLoading", false).set("loaded", true).set("deployAccessTokens", action.payload);
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_DEPLOY_ACCESS_TOKEN) {
        return state;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state = state.update("deployAccessTokens", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state = state.update("deployAccessTokens", (x) => removeInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state = state.update("deployAccessTokens", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
      }

      break;
    }
  }

  return state;
};

export default reducer;
