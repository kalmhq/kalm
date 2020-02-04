import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import { CREATE_COMPONENT_ACTION, ComponentFormValues } from "../actions";
import { Actions } from "../actions";

export type State = ImmutableMap<{
  components: Immutable.OrderedMap<string, ComponentFormValues>;
}>;

const initialState: State = Immutable.Map({
  components: Immutable.OrderedMap([])
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case CREATE_COMPONENT_ACTION:
      const components = state.get("components");
      state = state.set(
        "components",
        components.set(
          components.size.toString(), // TODO fake id
          action.payload.componentValues
        )
      );
  }

  return state;
};

export default reducer;
