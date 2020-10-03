import { Actions } from "types";
import { SET_DEBOUNCING, SET_TIMER, DebouncesMap } from "types/debounce";
import produce from "immer";

export type State = DebouncesMap;

export let initialState: State = {};

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
