import produce from "immer";
import { addOrUpdateInArray, removeInArray } from "reducers/utils";
import { Actions } from "types";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_HTTP_ROUTE,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import {
  CREATE_ROUTE_FULFILLED,
  DELETE_ROUTE_FULFILLED,
  HttpRoute,
  LOAD_ROUTES_FAILED,
  LOAD_ROUTES_FULFILLED,
  LOAD_ROUTES_PENDING,
  UPDATE_ROUTE_FULFILLED,
} from "types/route";

type State = {
  isLoading: boolean;
  isFirstLoaded: boolean;
  httpRoutes: HttpRoute[];
};

const initialState: State = {
  isLoading: false,
  isFirstLoaded: false,
  httpRoutes: [],
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOAD_ROUTES_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_ROUTES_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_ROUTES_FULFILLED: {
      state.isLoading = false;
      state.isFirstLoaded = true;
      state.httpRoutes = action.payload.httpRoutes;
      return;
    }
    case CREATE_ROUTE_FULFILLED: {
      state.httpRoutes = addOrUpdateInArray(state.httpRoutes, action.payload.route);
      return;
    }
    case UPDATE_ROUTE_FULFILLED: {
      state.httpRoutes = addOrUpdateInArray(state.httpRoutes, action.payload.route);
      return;
    }
    case DELETE_ROUTE_FULFILLED: {
      state.httpRoutes = removeInArray(state.httpRoutes, action.payload.route);
      return;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_HTTP_ROUTE) {
        return;
      }
      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state.httpRoutes = addOrUpdateInArray(state.httpRoutes, action.payload.data, false);
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state.httpRoutes = removeInArray(state.httpRoutes, action.payload.data);
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state.httpRoutes = addOrUpdateInArray(state.httpRoutes, action.payload.data);
          break;
        }
      }
      return;
    }
  }

  return;
}, initialState);

export default reducer;
