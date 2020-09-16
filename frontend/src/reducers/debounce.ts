import Immutable from "immutable";
import { Actions } from "types";
import { SET_DEBOUNCING, SET_TIMER, DebounceType } from "types/debounce";

export type State = DebounceType;

export let initialState: State = Immutable.Map();

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case SET_DEBOUNCING: {
      const { name, debouncing } = action.payload;
      return state.setIn([name, "debouncing"], debouncing);
    }
    case SET_TIMER: {
      const { name, timer } = action.payload;
      return state.setIn([name, "timer"], timer);
    }
  }

  return state;
};

export default reducer;
