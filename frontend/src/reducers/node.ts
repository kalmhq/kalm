import Immutable from "immutable";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import { LOGOUT, Metrics } from "types/common";
import { LOAD_NODES_FAILED, LOAD_NODES_FULFILlED, LOAD_NODES_PENDING, Node } from "types/node";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_NODE,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import { addOrUpdateInList, removeInList } from "reducers/utils";

interface StateContent {
  isLoading: boolean;
  isFirstLoaded: boolean;
  metrics: Metrics;
  nodes: Immutable.List<Node>;
  // use list instead of map, prevent some nodes labels have same key, but different value
  labels: Immutable.List<string>;
}

export type State = ImmutableMap<StateContent>;

const initialState: State = Immutable.Map({
  nodes: Immutable.List([]),
  metrics: Immutable.Map(),
  isLoading: false,
  isFirstLoaded: false,
  labels: Immutable.List([]),
});

const setLabels = (state: State): State => {
  let labelsSet = Immutable.Set();
  state.get("nodes").forEach((node) => {
    const labels = node.get("labels");

    if (labels) {
      labels.forEach((value, key) => {
        labelsSet = labelsSet.add(`${key}:${value}`);
      });
    }
  });

  return state.set("labels", labelsSet.toList());
};

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_NODE) {
        return state;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state = state.update("nodes", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state = state.update("nodes", (x) => removeInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state = state.update("nodes", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
      }

      return setLabels(state);
    }
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

      return setLabels(state);
    }
  }

  return state;
};

export default reducer;
