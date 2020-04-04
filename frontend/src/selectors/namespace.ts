import { store } from "../store";

export const getCurrentNamespace = (): string => {
  const state = store.getState();
  return state.get("namespaces").get("active");
};
