import { DebounceType } from "types/debounce";

export const getIsDisplayDebounceError = (debounceState: DebounceType | undefined, name: string) => {
  return debounceState?.get(name)?.get("debouncing");
};
