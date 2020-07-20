import { RootState } from "reducers";

export const getIsDisplayDebounceError = (state: RootState, formID: string, name: string) => {
  return !!state.get("debounce").get(formID)?.get(name)?.get("debouncing");
};
