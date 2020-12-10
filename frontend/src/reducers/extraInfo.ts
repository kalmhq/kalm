import produce from "immer";
import { Actions } from "types";
import { ExtraInfo, LOAD_EXTRA_INFO_FULFILLED } from "types/cluster";

export interface DependencyStateContent {
  info: ExtraInfo;
}

export type State = DependencyStateContent;

const initialState: State = {
  info: {} as any,
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOAD_EXTRA_INFO_FULFILLED: {
      state.info = action.payload;
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
