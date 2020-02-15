import Immutable from "immutable";
import { Actions, LOAD_NODES_ACTION } from "../actions";
import { ImmutableMap } from "../typings";

export type State = ImmutableMap<{
  nodes: kubernetes.Node[];
}>;

const initialState: State = Immutable.Map({
  nodes: []
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_NODES_ACTION: {
      return state.set("nodes", action.payload.nodes);
    }
  }

  return state;
};

export default reducer;
