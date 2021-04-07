import produce from "immer";
import { Actions } from "types";
import { DebouncesMap, SET_DEBOUNCING, SET_TIMER } from "types/debounce";

type State = DebouncesMap;

let initialState: State = {};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case SET_DEBOUNCING: {
      const { name, debouncing } = action.payload;
      if (state[name]) {
        state[name].debouncing = debouncing;
      } else {
        state[name] = {
          debouncing,
          timer: 0,
        };
      }
      return;
    }
    case SET_TIMER: {
      const { name, timer } = action.payload;
      if (state[name]) {
        state[name].timer = timer;
      } else {
        state[name] = {
          timer,
          debouncing: false,
        };
      }
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
