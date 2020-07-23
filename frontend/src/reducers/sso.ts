import Immutable from "immutable";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import { LOGOUT } from "types/common";
import {
  LOAD_PROTECTED_ENDPOINTS_FAILED,
  LOAD_PROTECTED_ENDPOINTS_FULFILLED,
  LOAD_PROTECTED_ENDPOINTS_PENDING,
  LOAD_SSO_CONFIG_FAILED,
  LOAD_SSO_CONFIG_FULFILLED,
  LOAD_SSO_CONFIG_PENDING,
  ProtectedEndpoint,
  SSOConfig,
} from "types/sso";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_PROTECTED_ENDPOINT,
  RESOURCE_TYPE_SSO,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";

export type State = ImmutableMap<{
  isLoading: boolean;
  loaded: boolean;
  config?: SSOConfig;
  isProtectedEndpointsLoaded: boolean;
  isProtectedEndpointsLoading: boolean;
  protectedEndpoints: Immutable.List<ProtectedEndpoint>;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  loaded: false,
  config: null,
  isProtectedEndpointsLoaded: false,
  isProtectedEndpointsLoading: false,
  protectedEndpoints: Immutable.List(),
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
    case LOAD_PROTECTED_ENDPOINTS_PENDING: {
      return state.set("isProtectedEndpointsLoading", true);
    }
    case LOAD_PROTECTED_ENDPOINTS_FAILED: {
      return state.set("isProtectedEndpointsLoading", false);
    }
    case LOAD_PROTECTED_ENDPOINTS_FULFILLED: {
      return state
        .set("isProtectedEndpointsLoading", false)
        .set("isProtectedEndpointsLoaded", true)
        .set("protectedEndpoints", action.payload);
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind === RESOURCE_TYPE_SSO) {
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
      } else if (action.kind === RESOURCE_TYPE_PROTECTED_ENDPOINT) {
        const endpoint = action.payload.data;

        const findIndex = (list: Immutable.List<ProtectedEndpoint>) => {
          return list.findIndex(
            (x) =>
              x.get("endpointName") === endpoint.get("endpointName") &&
              x.get("namespace") === endpoint.get("namespace"),
          );
        };

        switch (action.payload.action) {
          case RESOURCE_ACTION_UPDATE:
          case RESOURCE_ACTION_ADD: {
            state = state.update("protectedEndpoints", (list) => {
              const index = findIndex(list);

              if (index < 0) {
                return list.unshift(endpoint);
              }

              return list.set(index, endpoint);
            });
            break;
          }
          case RESOURCE_ACTION_DELETE: {
            state = state.update("protectedEndpoints", (list) => {
              const index = findIndex(list);

              if (index < 0) {
                return list;
              }

              return list.delete(index);
            });
            break;
          }
        }
      } else {
        return state;
      }
      break;
    }
  }

  return state;
};

export default reducer;
