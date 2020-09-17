interface Debounce {
  timer: number;
  debouncing: boolean;
}

export type DebouncesMap = { [key: string]: Debounce };

export const SET_DEBOUNCING = "SET_DEBOUNCING";
export const SET_TIMER = "SET_TIMER";

interface SetDebouncing {
  type: typeof SET_DEBOUNCING;
  payload: {
    name: string;
    debouncing: boolean;
  };
}

interface SetTimer {
  type: typeof SET_TIMER;
  payload: {
    name: string;
    timer: number;
  };
}

export type DebounceActions = SetDebouncing | SetTimer;
