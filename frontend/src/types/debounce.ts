import { ImmutableMap } from "typings";

interface Debounce {
  timer: number;
  debouncing: boolean;
}

export type DebounceType = ImmutableMap<{ [key: string]: ImmutableMap<Debounce> }>;

export const SET_DEBOUNCING = "SET_DEBOUNCING";
export const SET_TIMER = "SET_TIMER";

interface SetDebouncing {
  type: typeof SET_DEBOUNCING;
  payload: {
    formID: string;
    name: string;
    debouncing: boolean;
  };
}

interface SetTimer {
  type: typeof SET_TIMER;
  payload: {
    formID: string;
    name: string;
    timer: number;
  };
}

export type DebounceActions = SetDebouncing | SetTimer;
