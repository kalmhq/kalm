import produce from "immer";
import { addOrUpdateInArray, isInArray, removeInArray } from "reducers/utils";
import { Actions } from "types";
import { LOGOUT, Metrics } from "types/common";
import { LOAD_NODES_FAILED, LOAD_NODES_FULFILLED, LOAD_NODES_PENDING, Node } from "types/node";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_NODE,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";

type State = {
  isLoading: boolean;
  isFirstLoaded: boolean;
  metrics: Metrics;
  nodes: Node[];
  // use list instead of map, prevent some nodes labels have same key, but different value
  labels: string[];
};

const initialState: State = {
  nodes: [],
  metrics: {
    isMetricServerEnabled: false,
    cpu: [],
    memory: [],
  },
  isLoading: false,
  isFirstLoaded: false,
  labels: [],
};

const setLabels = (state: State): State => {
  let labelsSet = new Set();
  state.nodes.forEach((node) => {
    const labels = node.labels || {};

    if (labels) {
      for (let key in labels) {
        let value = labels[key];
        labelsSet.add(`${key}:${value}`);
      }
    }
  });

  state.labels = Array.from(labelsSet) as string[];
  return state;
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_NODE) {
        return;
      }
      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          if (!isInArray(state.nodes, action.payload.data)) {
            state.nodes = addOrUpdateInArray(state.nodes, action.payload.data);
          }
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state.nodes = removeInArray(state.nodes, action.payload.data);
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state.nodes = addOrUpdateInArray(state.nodes, action.payload.data);
          break;
        }
      }
      state = setLabels(state);
      return;
    }
    case LOGOUT: {
      return initialState;
    }
    case LOAD_NODES_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_NODES_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_NODES_FULFILLED: {
      state.isLoading = false;
      state.isFirstLoaded = true;
      state.nodes = action.payload.nodes;
      state.metrics = action.payload.metrics;

      state = setLabels(state);
      return;
    }
  }

  return;
}, initialState);

export default reducer;
