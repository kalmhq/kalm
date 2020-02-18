import Immutable from "immutable";
import { Actions, LOAD_NODES } from "../actions";
import { V1Node } from "../model/v1Node";
import { ImmutableMap } from "../typings";

export type State = ImmutableMap<{
  nodes: V1Node[];
}>;

const initialState: State = Immutable.Map({
  nodes: []
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_NODES: {
      return state.set("nodes", action.payload.nodes);
    }
  }

  return state;
};

export default reducer;
