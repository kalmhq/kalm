import produce from "immer";
import { Actions } from "types";
import { ExtraInfo, LOAD_EXTRA_INFO_FAILED, LOAD_EXTRA_INFO_FULFILLED, LOAD_EXTRA_INFO_PENDING } from "types/cluster";

export interface DependencyStateContent {
  isLoading: boolean;
  isFirstLoaded: boolean;
  info: ExtraInfo;
}

export type State = DependencyStateContent;

const initialState: State = {
  isLoading: false,
  isFirstLoaded: false,
  info: {} as any,
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOAD_EXTRA_INFO_PENDING: {
      state.isLoading = true;
      return;
    }
    case LOAD_EXTRA_INFO_FAILED: {
      state.isLoading = false;
      return;
    }
    case LOAD_EXTRA_INFO_FULFILLED: {
      state.isLoading = false;
      state.isFirstLoaded = true;
      state.info = action.payload;
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
