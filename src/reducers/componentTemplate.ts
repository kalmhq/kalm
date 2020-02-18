import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import {
  CREATE_COMPONENT,
  ComponentTemplate,
  UPDATE_COMPONENT,
  DELETE_COMPONENT,
  DUPLICATE_COMPONENT,
  LOAD_COMPONENT_TEMPLATES_FULFILLED,
  LOAD_COMPONENT_TEMPLATES_PENDING
} from "../actions";
import { Actions } from "../actions";

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
    case LOAD_COMPONENT_TEMPLATES_FULFILLED: {
      let om = Immutable.OrderedMap<string, ComponentTemplate>();

      action.payload.components.forEach(x => {
        om = om.set(x.get("id"), x);
      });

      state = state.set("componentTemplates", om);
      state = state.set("isListLoading", false);
      state = state.set("isListFirstLoaded", true);
      break;
    }
    case CREATE_COMPONENT: {
      const components = state.get("componentTemplates");
      const tmpId = components.size.toString(); // TODO fake id
      let component = action.payload.component;
      component = component.set("id", tmpId);
      state = state.set(
        "componentTemplates",
        components.set(
          tmpId, // TODO fake id
          component
        )
      );
      break;
    }
    case UPDATE_COMPONENT: {
      const components = state.get("componentTemplates");
      const id = action.payload.componentTemplateId;
      let component = action.payload.component;
      component = component.set("id", id);
      state = state.set("componentTemplates", components.set(id, component));
      break;
    }
    case DELETE_COMPONENT: {
      state = state.deleteIn([
        "componentTemplates",
        action.payload.componentTemplateId
      ]);
      break;
    }
    case DUPLICATE_COMPONENT: {
      const components = state.get("componentTemplates");
      const tmpId = components.size.toString(); // TODO fake id

      let component = components.get(action.payload.componentTemplateId)!;
      component = component.set("id", tmpId);

      let i = 0;
      let name = "";
      do {
        i += 1;
        name = `${component.get("name")}-duplicate-${i}`;
      } while (components.find(x => x.get("name") === name));

      component = component.set("name", name);
      state = state.set("componentTemplates", components.set(tmpId, component));
      break;
    }
  }
  return state;
};

export default reducer;
