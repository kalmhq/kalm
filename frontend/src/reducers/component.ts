import Immutable from "immutable";
import { Actions } from "types";
import {
  ApplicationComponentDetails,
  ComponentPlugin,
  CREATE_COMPONENT,
  DELETE_COMPONENT,
  LOAD_COMPONENT_PLUGINS_FULFILLED,
  SET_IS_SUBMITTING_APPLICATION_COMPONENT,
  UPDATE_COMPONENT,
  LOAD_COMPONENTS_PENDING,
  LOAD_COMPONENTS_FAILED,
  LOAD_COMPONENTS_FULFILLED,
  LOAD_ALL_NAMESAPCES_COMPONETS,
} from "types/application";
import { LOGOUT } from "types/common";
import { ImmutableMap } from "typings";
import {
  WATCHED_RESOURCE_CHANGE,
  RESOURCE_TYPE_COMPONENT,
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
} from "types/resources";

export type State = ImmutableMap<{
  components: Immutable.Map<string, Immutable.List<ApplicationComponentDetails>>; // key applicationName
  isListLoading: boolean;
  isListFirstLoaded: boolean;
  isSubmittingApplicationComponent: boolean;
  componentPlugins: ComponentPlugin[];
}>;

const initialState: State = Immutable.Map({
  components: Immutable.Map({}),
  isListLoading: false,
  isListFirstLoaded: false,
  isSubmittingApplicationComponent: false,
  componentPlugins: [],
});

const isComponentInState = (state: State, applicationName: string, component: ApplicationComponentDetails): boolean => {
  let components = state.get("components").get(applicationName);
  if (!components) {
    return false;
  }

  const componentIndex = components.findIndex((c) => c.get("name") === component.get("name"));
  if (componentIndex < 0) {
    return false;
  }

  return true;
};

const putComponentIntoState = (
  state: State,
  applicationName: string,
  component: ApplicationComponentDetails,
  isCreate: boolean,
): State => {
  let components = state.get("components").get(applicationName);
  if (!components) {
    components = Immutable.List([]) as Immutable.List<ApplicationComponentDetails>;
    state = state.setIn(["components", applicationName], components);
  }
  const componentIndex = components.findIndex((c) => c.get("name") === component.get("name"));
  if (componentIndex < 0) {
    if (isCreate) {
      state = state.setIn(["components", applicationName, components.size], component);
    }
  } else {
    state = state.setIn(["components", applicationName, componentIndex], component);
  }

  return state;
};

const deleteComponentFromState = (state: State, applicationName: string, componentName: string): State => {
  const components = state.get("components").get(applicationName);
  if (!components) {
    return state;
  }
  const componentIndex = components.findIndex((c) => c.get("name") === componentName);
  if (componentIndex >= 0) {
    state = state.deleteIn(["components", applicationName, componentIndex]);
  }

  return state;
};

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case SET_IS_SUBMITTING_APPLICATION_COMPONENT: {
      state = state.set("isSubmittingApplicationComponent", action.payload.isSubmittingApplicationComponent);
      break;
    }
    case LOAD_COMPONENTS_PENDING: {
      state = state.set("isListLoading", true);
      break;
    }
    case LOAD_COMPONENTS_FAILED: {
      state = state.set("isListLoading", false);
      break;
    }
    case LOAD_COMPONENTS_FULFILLED: {
      state = state.set("isListFirstLoaded", true).set("isListLoading", false);
      state = state.setIn(["components", action.payload.applicationName], action.payload.components);

      break;
    }
    case LOAD_ALL_NAMESAPCES_COMPONETS: {
      state = state.set("components", action.payload.components);
      break;
    }
    case CREATE_COMPONENT: {
      state = putComponentIntoState(state, action.payload.applicationName, action.payload.component, true);
      break;
    }
    case UPDATE_COMPONENT: {
      state = putComponentIntoState(state, action.payload.applicationName, action.payload.component, false);
      break;
    }
    case DELETE_COMPONENT: {
      const { applicationName, componentName } = action.payload;
      state = deleteComponentFromState(state, applicationName, componentName);
      break;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_COMPONENT) {
        return state;
      }
      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          if (!isComponentInState(state, action.payload.namespace, action.payload.data)) {
            state = putComponentIntoState(state, action.payload.namespace, action.payload.data, true);
          }
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state = deleteComponentFromState(state, action.payload.namespace, action.payload.data.get("name"));
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state = putComponentIntoState(state, action.payload.namespace, action.payload.data, false);
          break;
        }
      }
      break;
    }
    case LOAD_COMPONENT_PLUGINS_FULFILLED: {
      state = state.set("componentPlugins", action.payload.componentPlugins);

      break;
    }
  }

  return state;
};

export default reducer;
