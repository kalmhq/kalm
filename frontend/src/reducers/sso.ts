import Immutable from "immutable";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import { LOGOUT } from "types/common";
import { LOAD_SSO_CONFIG_FAILED, LOAD_SSO_CONFIG_FULFILLED, LOAD_SSO_CONFIG_PENDING, SSOConfig } from "types/sso";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_SSO,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";

export type State = ImmutableMap<{
  isLoading: boolean;
  loaded: boolean;
  config?: SSOConfig;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  loaded: false,
  config: null,
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_SSO_CONFIG_PENDING: {
      return state.set("isLoading", true);
    }
    case LOAD_SSO_CONFIG_FAILED: {
      return state.set("isLoading", false);
    }
    case LOAD_SSO_CONFIG_FULFILLED: {
      return state.set("isLoading", false).set("loaded", true).set("config", action.payload);
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_SSO) {
        return state;
      }
      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state = state.set("config", action.payload.data);
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state = state.set("config", null);
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state = state.set("config", action.payload.data);
          break;
        }
      }
      break;
    }
  }

  return state;
};

export default reducer;
