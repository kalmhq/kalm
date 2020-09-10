import produce from "immer";
import { Actions } from "types";
import {
  ClusterInfo,
  LOAD_CLUSTER_INFO_FAILED,
  LOAD_CLUSTER_INFO_FULFILlED,
  LOAD_CLUSTER_INFO_PENDING,
} from "types/cluster";
import { LOGOUT } from "types/common";

export interface DependencyStateContent {
  info: ClusterInfo;
  isLoading: boolean;
  isFirstLoaded: boolean;
}

export type State = DependencyStateContent;

const initialState: State = {
  info: {} as any,
  isLoading: false,
  isFirstLoaded: false,
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOGOUT: {
      state = initialState;
      return;
    }
    case LOAD_CLUSTER_INFO_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_CLUSTER_INFO_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_CLUSTER_INFO_FULFILlED: {
      state.isFirstLoaded = true;
      state.isLoading = false;
      state.info = action.payload;
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
