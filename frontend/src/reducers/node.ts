import Immutable from "immutable";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import { LOGOUT, Metrics } from "types/common";
import { LOAD_NODES_FAILED, LOAD_NODES_FULFILlED, LOAD_NODES_PENDING, Node } from "types/node";

export type State = ImmutableMap<{
  isLoading: boolean;
  isFirstLoaded: boolean;
  metrics: Metrics;
  nodes: Immutable.List<Node>;
  // use list instead of map, prevent some nodes labels have same key, but different value
  labels: Immutable.List<string>;
}>;

const initialState: State = Immutable.Map({
  nodes: Immutable.List([]),
  metrics: Immutable.Map(),
  isLoading: false,
  isFirstLoaded: false,
  labels: Immutable.List([]),
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_NODES_PENDING: {
      return state.set("isLoading", true);
    }
    case LOAD_NODES_FAILED: {
      return state.set("isLoading", false);
    }
    case LOAD_NODES_FULFILlED: {
      state = state.set("isLoading", false);
      state = state.set("isFirstLoaded", true);

      state = state.set("nodes", action.payload.get("nodes"));
      state = state.set("metrics", action.payload.get("metrics"));

      let labelsSet = Immutable.Set();
      action.payload.get("nodes").forEach((node) => {
        const labels = node.get("labels");
        if (labels) {
          labels.forEach((value, key) => {
            labelsSet = labelsSet.add(`${key}:${value}`);
          });
        }
      });
      state = state.set("labels", labelsSet.toList());
      return state;
    }
  }

  return state;
};

export default reducer;
