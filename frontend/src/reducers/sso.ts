import produce, { original } from "immer";
import { Actions } from "types";
import { LOGOUT } from "types/common";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_PROTECTED_ENDPOINT,
  RESOURCE_TYPE_SSO,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
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

type State = {
  isLoading: boolean;
  loaded: boolean;
  config: SSOConfig | null;
  isProtectedEndpointsLoaded: boolean;
  isProtectedEndpointsLoading: boolean;
  protectedEndpoints: ProtectedEndpoint[];
};

const initialState: State = {
  isLoading: false,
  loaded: false,
  config: null,
  isProtectedEndpointsLoaded: false,
  isProtectedEndpointsLoading: false,
  protectedEndpoints: [],
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_SSO_CONFIG_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_SSO_CONFIG_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_SSO_CONFIG_FULFILLED: {
      state.isLoading = false;
      state.loaded = true;
      state.config = action.payload;
      return;
    }
    case LOAD_PROTECTED_ENDPOINTS_PENDING: {
      state.isProtectedEndpointsLoading = true;
      return;
    }
    case LOAD_PROTECTED_ENDPOINTS_FAILED: {
      state.isProtectedEndpointsLoading = false;
      return;
    }
    case LOAD_PROTECTED_ENDPOINTS_FULFILLED: {
      state.isProtectedEndpointsLoading = false;
      state.isProtectedEndpointsLoaded = true;
      state.protectedEndpoints = action.payload;
      return;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind === RESOURCE_TYPE_SSO) {
        switch (action.payload.action) {
          case RESOURCE_ACTION_ADD: {
            state.config = action.payload.data;
            return;
          }
          case RESOURCE_ACTION_DELETE: {
            state.config = null;
            return;
          }
          case RESOURCE_ACTION_UPDATE: {
            state.config = action.payload.data;
            return;
          }
        }
      } else if (action.kind === RESOURCE_TYPE_PROTECTED_ENDPOINT) {
        const endpoint = action.payload.data;

        const findIndex = (arr: ProtectedEndpoint[]) => {
          return arr.findIndex((x) => x.name === endpoint.name && x.namespace === endpoint.namespace);
        };

        switch (action.payload.action) {
          case RESOURCE_ACTION_UPDATE:
          case RESOURCE_ACTION_ADD: {
            const index = findIndex(original(state.protectedEndpoints)!);
            if (index < 0) {
              state.protectedEndpoints.unshift(endpoint);
            } else {
              state.protectedEndpoints[index] = endpoint;
            }

            return;
          }
          case RESOURCE_ACTION_DELETE: {
            const index = findIndex(original(state.protectedEndpoints)!);
            if (index >= 0) {
              state.protectedEndpoints.splice(index, 1);
            }
            return;
          }
        }
      } else {
        return;
      }
      return;
    }
  }

  return;
}, initialState);

export default reducer;
