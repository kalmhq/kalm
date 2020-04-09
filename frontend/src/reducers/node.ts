import Immutable from "immutable";
import { Actions } from "../types";
import { ImmutableMap } from "../typings";
import { LOAD_NODES } from "../types/common";

export type State = ImmutableMap<{
  nodes: any[];
  // use list instead of map, prevent some nodes labels have same key, but different value
  labels: Immutable.List<string>;
}>;

const initialState: State = Immutable.Map({
  nodes: [],
  labels: Immutable.List([])
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_NODES: {
      state = state.set("nodes", action.payload.nodes);
      let labelsSet = Immutable.Set();
      action.payload.nodes.forEach(node => {
        const labels = node.metadata?.labels;
        if (labels) {
          for (let key in labels) {
            labelsSet = labelsSet.add(`${key}:${labels[key]}`);
          }
        }
      });
      state = state.set("labels", labelsSet.toList());
      return state;
    }
  }

  return state;
};

export default reducer;
