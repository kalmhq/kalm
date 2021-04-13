import { k8sToKalmNode } from "api/transformers";
import produce from "immer";
import { Actions } from "types";
import { LOGOUT, Metrics } from "types/common";
import { K8sNode } from "types/k8s";
import { Node } from "types/node";

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

const reducer = produce((state: State, action: Actions) => {
  // @ts-ignore
  if (!action.payload || !action.payload || action.payload.kind !== "Node") {
    return state;
  }

  switch (action.type) {
    case "ADDED": {
      const index = state.nodes.findIndex((x) => x.name === action.payload.metadata.name);

      if (index >= 0) {
        state.nodes[index] = k8sToKalmNode((action.payload as any) as K8sNode);
      } else {
        state.nodes.push(k8sToKalmNode((action.payload as any) as K8sNode));
      }

      return state;
    }
    case "DELETED": {
      const index = state.nodes.findIndex((x) => x.name === action.payload.metadata.name);

      if (index >= 0) {
        delete state.nodes[index];
      }
      return state;
    }
    case "MODIFIED": {
      const index = state.nodes.findIndex((x) => x.name === action.payload.metadata.name);

      if (index >= 0) {
        state.nodes[index] = k8sToKalmNode((action.payload as any) as K8sNode);
      }
      return state;
    }
  }
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
  }

  return;
}, initialState);

export default reducer;
