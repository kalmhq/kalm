import Immutable from "immutable";
import {
  ClusterInfo,
  LOAD_CLUSTER_INFO_FAILED,
  LOAD_CLUSTER_INFO_FULFILlED,
  LOAD_CLUSTER_INFO_PENDING,
} from "types/cluster";
import { LOGOUT } from "types/common";
import { Actions } from "types";
import { ImmutableMap } from "typings";

export interface DependencyStateContent {
  info: ClusterInfo;
  isLoading: boolean;
  isFirstLoaded: boolean;
}

export type State = ImmutableMap<DependencyStateContent>;

const initialState: State = Immutable.Map({
  info: Immutable.Map(),
  isListLoading: false,
  isFirstLoaded: false,
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_CLUSTER_INFO_PENDING: {
      state = state.set("isLoading", true);
      break;
    }
    case LOAD_CLUSTER_INFO_FAILED: {
      state = state.set("isLoading", false);
      break;
    }
    case LOAD_CLUSTER_INFO_FULFILlED: {
      state = state.set("isFirstLoaded", true).set("isLoading", false);
      state = state.set("info", action.payload);
      break;
    }
  }

  return state;
};

export default reducer;
