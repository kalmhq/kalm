import { RootState } from "reducers";

export const getIsDisplayDebounceError = (state: RootState, name: string) => {
  return !!state.debounce[name]?.debouncing;
};
