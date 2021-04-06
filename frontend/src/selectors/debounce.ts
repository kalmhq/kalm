import { RootState } from "configureStore";

export const getIsDisplayDebounceError = (state: RootState, name: string) => {
  return !!state.debounce[name]?.debouncing;
};
