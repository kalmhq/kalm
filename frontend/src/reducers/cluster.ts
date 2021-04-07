import produce from "immer";
import { Actions } from "types";
import {
  ClusterInfo,
  LOAD_CLUSTER_INFO_FAILED,
  LOAD_CLUSTER_INFO_FULFILLED,
  LOAD_CLUSTER_INFO_PENDING,
} from "types/cluster";
import { LOGOUT } from "types/common";

interface DependencyStateContent {
  info: ClusterInfo;
  isLoading: boolean;
  isFirstLoaded: boolean;
}

type State = DependencyStateContent;

const initialState: State = {
  info: {} as any,
  isLoading: false,
  isFirstLoaded: false,
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_CLUSTER_INFO_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_CLUSTER_INFO_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_CLUSTER_INFO_FULFILLED: {
      state.isFirstLoaded = true;
      state.isLoading = false;
      state.info = action.payload;
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
