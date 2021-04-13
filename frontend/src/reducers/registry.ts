import { k8sToKalmDockerRegistry } from "api/transformers";
import produce from "immer";
import { Actions } from "types";
import { LOGOUT } from "types/common";
import { DockerRegistry } from "types/k8s";
import { Registry } from "types/registry";

type State = {
  isLoading: boolean;
  isFirstLoaded: boolean;
  isSubmittingRegistry: boolean;
  registries: Registry[];
};

const initialState: State = {
  isLoading: false,
  isFirstLoaded: false,
  isSubmittingRegistry: false,
  registries: [],
};

const reducer = produce((state: State, action: Actions) => {
  // @ts-ignore
  if (!action.payload || !action.payload || action.payload.kind !== "Node") {
    return state;
  }

  switch (action.type) {
    case "ADDED": {
      const index = state.registries.findIndex((x) => x.name === action.payload.metadata.name);

      if (index >= 0) {
        state.registries[index] = k8sToKalmDockerRegistry((action.payload as any) as DockerRegistry);
      } else {
        state.registries.push(k8sToKalmDockerRegistry((action.payload as any) as DockerRegistry));
      }

      return state;
    }
    case "DELETED": {
      const index = state.registries.findIndex((x) => x.name === action.payload.metadata.name);

      if (index >= 0) {
        delete state.registries[index];
      }
      return state;
    }
    case "MODIFIED": {
      const index = state.registries.findIndex((x) => x.name === action.payload.metadata.name);

      if (index >= 0) {
        state.registries[index] = k8sToKalmDockerRegistry((action.payload as any) as DockerRegistry);
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
