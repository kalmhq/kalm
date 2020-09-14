import { RootState } from "reducers";

export const getIsDisplayDebounceError = (state: RootState, name: string) => {
  return !!state.get("debounce").get(name)?.get("debouncing");
};
