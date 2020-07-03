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
  WATCHED_RESOURCE_CHANGE,
  RESOURCE_TYPE_HTTP_ROUTE,
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
} from "types/resources";

export type State = ImmutableMap<{
  isLoading: boolean;
  isFirstLoaded: boolean;
  httpRoutes: Immutable.Map<string, Immutable.List<HttpRoute>>;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  isFirstLoaded: false,
  httpRoutes: Immutable.Map({}),
});

const putHttpRouteIntoState = (
  state: State,
  applicationName: string,
  httpRoute: HttpRoute,
  isCreate: boolean,
): State => {
  const httpRoutes = state.get("httpRoutes").get(applicationName);
  if (!httpRoutes) {
    return state;
  }
  const httpRouteIndex = httpRoutes.findIndex((c) => c.get("name") === httpRoute.get("name"));
  if (httpRouteIndex < 0 && isCreate) {
    state = state.setIn(["httpRoutes", applicationName, httpRoutes.size], httpRoute);
  } else {
    state = state.setIn(["httpRoutes", applicationName, httpRouteIndex], httpRoute);
  }

  return state;
};

const deleteHttpRouteFromState = (state: State, applicationName: string, httpRouteName: string): State => {
  const httpRoutes = state.get("httpRoutes").get(applicationName);
  if (!httpRoutes) {
    return state;
  }
  const httpRouteIndex = httpRoutes.findIndex((c) => c.get("name") === httpRouteName);
  if (httpRouteIndex >= 0) {
    state = state.deleteIn(["httpRoutes", applicationName, httpRouteIndex]);
  }

  return state;
};

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
      if (action.payload.namespace) {
        state = state.setIn(["httpRoutes", action.payload.namespace], action.payload.httpRoutes);
      } else {
        // all namespaces
        let routesMap: Immutable.Map<string, Immutable.List<HttpRoute>> = Immutable.Map({});
        action.payload.httpRoutes.forEach((route) => {
          const namespace = route.get("namespace");
          const routes = routesMap.get(namespace);
          if (routes && routes.size > 0) {
            routesMap = routesMap.set(namespace, routes.push(route));
          } else {
            routesMap = routesMap.set(namespace, Immutable.List([route]));
          }
        });
        state = state.set("httpRoutes", routesMap);
      }
      break;
    }
    case CREATE_ROUTE_FULFILLED: {
      state = putHttpRouteIntoState(state, action.payload.namespace, action.payload.route, true);
      break;
    }
    case UPDATE_ROUTE_FULFILLED: {
      state = putHttpRouteIntoState(state, action.payload.namespace, action.payload.route, false);
      break;
    }
    case DELETE_ROUTE_FULFILLED: {
      state = deleteHttpRouteFromState(state, action.payload.namespace, action.payload.name);
      break;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_HTTP_ROUTE) {
        return state;
      }
      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state = putHttpRouteIntoState(state, action.payload.namespace, action.payload.data, true);
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state = deleteHttpRouteFromState(state, action.payload.namespace, action.payload.data.get("name"));
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state = putHttpRouteIntoState(state, action.payload.namespace, action.payload.data, false);
          break;
        }
      }
      break;
    }
  }

  return state;
};

export default reducer;
