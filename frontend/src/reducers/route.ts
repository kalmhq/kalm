import Immutable from "immutable";
import {
  CREATE_ROUTE_FULFILLED,
  DELETE_ROUTE_FULFILLED,
  HttpRoute,
  LOAD_ROUTES_FAILED,
  LOAD_ROUTES_FULFILLED,
  LOAD_ROUTES_PENDING,
  UPDATE_ROUTE_FULFILLED,
} from "types/route";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_HTTP_ROUTE,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import { addOrUpdateInList, removeInList } from "reducers/utils";

export type State = ImmutableMap<{
  isLoading: boolean;
  isFirstLoaded: boolean;
  httpRoutes: Immutable.List<HttpRoute>;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  isFirstLoaded: false,
  httpRoutes: Immutable.List(),
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_ROUTES_PENDING: {
      return state.set("isLoading", true);
    }
    case LOAD_ROUTES_FAILED: {
      return state.set("isLoading", false);
    }
    case LOAD_ROUTES_FULFILLED: {
      state = state.set("isLoading", false);
      state = state.set("isFirstLoaded", true);
      state = state.set("httpRoutes", action.payload.httpRoutes);
      break;
    }
    case CREATE_ROUTE_FULFILLED: {
      state = state.update("httpRoutes", (x) => addOrUpdateInList(x, action.payload.route));
      break;
    }
    case UPDATE_ROUTE_FULFILLED: {
      state = state.update("httpRoutes", (x) => addOrUpdateInList(x, action.payload.route));
      break;
    }
    case DELETE_ROUTE_FULFILLED: {
      state = state.update("httpRoutes", (x) => removeInList(x, action.payload.route));
      break;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_HTTP_ROUTE) {
        return state;
      }
      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state = state.update("httpRoutes", (x) => addOrUpdateInList(x, action.payload.data, false));
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state = state.update("httpRoutes", (x) => removeInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state = state.update("httpRoutes", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
      }
      break;
    }
  }

  return state;
};

export default reducer;
