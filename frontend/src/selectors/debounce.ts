import { RootState } from "store";

export const getIsDisplayDebounceError = (state: RootState, name: string) => {
  return !!state.debounce[name]?.debouncing;
};
