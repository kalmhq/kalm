import produce from "immer";
import { Actions } from "types";
import { LOAD_TENANT_INFO_FAILED, LOAD_TENANT_INFO_FULFILLED, LOAD_TENANT_INFO_PENDING } from "types/cluster";
import { LOGOUT } from "types/common";
import { RESOURCE_ACTION_UPDATE, RESOURCE_TYPE_TENANT, WATCHED_RESOURCE_CHANGE } from "types/resources";
import { Tenant } from "types/tenant";

export interface DependencyStateContent {
  info: Tenant;
  isLoading: boolean;
  isFirstLoaded: boolean;
}

export type State = DependencyStateContent;

const initialState: State = {
  info: {} as any,
  isLoading: false,
  isFirstLoaded: false,
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_TENANT) {
        return;
      }
      switch (action.payload.action) {
        case RESOURCE_ACTION_UPDATE: {
          state.info = action.payload.data;
          break;
        }
      }
      return;
    }
    case LOGOUT: {
      return initialState;
    }
    case LOAD_TENANT_INFO_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_TENANT_INFO_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_TENANT_INFO_FULFILLED: {
      state.isFirstLoaded = true;
      state.isLoading = false;
      state.info = action.payload;
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
