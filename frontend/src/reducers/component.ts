import produce, { original } from "immer";
import { Actions } from "types";
import {
  ApplicationComponentDetails,
  CREATE_COMPONENT,
  DELETE_COMPONENT,
  LOAD_ALL_NAMESAPCES_COMPONETS,
  LOAD_COMPONENTS_FAILED,
  LOAD_COMPONENTS_FULFILLED,
  LOAD_COMPONENTS_PENDING,
  SET_IS_SUBMITTING_APPLICATION_COMPONENT,
  UPDATE_COMPONENT,
} from "types/application";
import { LOGOUT } from "types/common";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_COMPONENT,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";

type State = {
  components: { [key: string]: ApplicationComponentDetails[] }; // key applicationName
  isListLoading: boolean;
  isListFirstLoaded: boolean;
  isSubmittingApplicationComponent: boolean;
};

const initialState: State = {
  components: {},
  isListLoading: false,
  isListFirstLoaded: false,
  isSubmittingApplicationComponent: false,
};

const isComponentInState = (state: State, applicationName: string, component: ApplicationComponentDetails): boolean => {
  let components = state.components[applicationName];
  if (!components) {
    return false;
  }

  const componentIndex = original(components)!.findIndex((c) => c.name === component.name);
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
  let components = state.components[applicationName];
  let componentIndex = -1;
  if (!components) {
    state.components[applicationName] = [];
  } else {
    componentIndex = original(components)!.findIndex((c) => c.name === component.name);
  }
  if (componentIndex < 0) {
    if (isCreate) {
      state.components[applicationName].push(component);
    }
  } else {
    state.components[applicationName][componentIndex] = component;
  }

  return state;
};

const deleteComponentFromState = (state: State, applicationName: string, componentName: string): State => {
  const components = state.components[applicationName];
  if (!components) {
    return state;
  }
  const componentIndex = components.findIndex((c) => c.name === componentName);
  if (componentIndex >= 0) {
    state.components[applicationName].splice(componentIndex, 1);
  }

  return state;
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case SET_IS_SUBMITTING_APPLICATION_COMPONENT: {
      state.isSubmittingApplicationComponent = action.payload.isSubmittingApplicationComponent;
      return;
    }
    case LOAD_COMPONENTS_PENDING: {
      state.isListLoading = true;
      return;
    }
    case LOAD_COMPONENTS_FAILED: {
      state.isListLoading = false;
      return;
    }
    case LOAD_COMPONENTS_FULFILLED: {
      state.isListFirstLoaded = true;
      state.isListLoading = false;
      state.components[action.payload.applicationName] = action.payload.components;
      return;
    }
    case LOAD_ALL_NAMESAPCES_COMPONETS: {
      state.components = action.payload.components;
      return;
    }
    case CREATE_COMPONENT: {
      state = putComponentIntoState(state, action.payload.applicationName, action.payload.component, true);
      return;
    }
    case UPDATE_COMPONENT: {
      state = putComponentIntoState(state, action.payload.applicationName, action.payload.component, false);
      return;
    }
    case DELETE_COMPONENT: {
      const { applicationName, componentName } = action.payload;
      state = deleteComponentFromState(state, applicationName, componentName);
      return;
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
          return;
        }
        case RESOURCE_ACTION_DELETE: {
          state = deleteComponentFromState(state, action.payload.namespace, action.payload.data.name);
          return;
        }
        case RESOURCE_ACTION_UPDATE: {
          state = putComponentIntoState(state, action.payload.namespace, action.payload.data, false);
          return;
        }
        default:
          return;
      }
    }
  }

  return state;
}, initialState);

export default reducer;
