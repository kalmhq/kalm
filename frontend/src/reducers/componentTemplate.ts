import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import { Actions } from "../types";
import {
  ComponentTemplate,
  LOAD_COMPONENT_TEMPLATES_PENDING,
  LOAD_COMPONENT_TEMPLATES_FULFILLED,
  LOAD_COMPONENT_TEMPLATES_FAILED,
  CREATE_COMPONENT,
  UPDATE_COMPONENT,
  DUPLICATE_COMPONENT,
  DELETE_COMPONENT
} from "../types/componentTemplate";

export type State = ImmutableMap<{
  componentTemplates: Immutable.OrderedMap<string, ComponentTemplate>;
  isListLoading: boolean;
  isListFirstLoaded: boolean;
}>;

const initialState: State = Immutable.Map({
  componentTemplates: Immutable.OrderedMap(),
  isListLoading: false,
  isListFirstLoaded: false
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_COMPONENT_TEMPLATES_PENDING:
      return state.set("isListLoading", true);
    case LOAD_COMPONENT_TEMPLATES_FAILED:
      return state.set("isListLoading", false);
    case LOAD_COMPONENT_TEMPLATES_FULFILLED: {
      let om = Immutable.OrderedMap<string, ComponentTemplate>();

      action.payload.componentTemplates.forEach(x => {
        om = om.set(x.get("name"), x);
      });

      state = state.set("componentTemplates", om);
      state = state.set("isListLoading", false);
      state = state.set("isListFirstLoaded", true);
      break;
    }
    case CREATE_COMPONENT: {
      const components = state.get("componentTemplates");
      let componentTemplate = action.payload.componentTemplate;
      state = state.set("componentTemplates", components.set(componentTemplate.get("name"), componentTemplate));
      break;
    }
    case UPDATE_COMPONENT: {
      const components = state.get("componentTemplates");
      let componentTemplate = action.payload.componentTemplate;
      state = state.set("componentTemplates", components.set(componentTemplate.get("name"), componentTemplate));
      break;
    }
    case DUPLICATE_COMPONENT: {
      const components = state.get("componentTemplates");
      let componentTemplate = action.payload.componentTemplate;
      state = state.set("componentTemplates", components.set(componentTemplate.get("name"), componentTemplate));
      break;
    }
    case DELETE_COMPONENT: {
      state = state.deleteIn(["componentTemplates", action.payload.componentTemplateName]);
      break;
    }
  }
  return state;
};

export default reducer;
