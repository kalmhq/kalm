import { ThunkResult } from "types";
import { SET_DEBOUNCING, SET_TIMER } from "types/debounce";

export const setDebouncing = (name: string): ThunkResult<void> => {
  return (dispatch, getState) => {
    const debounceState = getState().get("debounce");

    dispatch({
      type: SET_DEBOUNCING,
      payload: { name, debouncing: false },
    });

    const currentTimer = debounceState.get(name)?.get("timer");
    if (currentTimer) {
      window.clearTimeout(currentTimer);
    }

    const timer = window.setTimeout(() => {
      dispatch({
        type: SET_DEBOUNCING,
        payload: { name, debouncing: true },
      });
    }, 3000);

    dispatch({
      type: SET_TIMER,
      payload: { name, timer },
    });
  };
};
