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

const putComponentIntoState = (
  state: State,
  applicationName: string,
  component: ApplicationComponentDetails,
  isCreate: boolean,
): State => {
  const components = state.get("components").get(applicationName);
  if (!components) {
    return state;
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
      const components = state.get("components").get(applicationName);
      if (!components) {
        return state;
      }
      const componentIndex = components.findIndex((c) => c.get("name") === componentName);
      if (componentIndex < 0) {
        break;
      }
      state = state.deleteIn(["components", applicationName, componentIndex]);
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
