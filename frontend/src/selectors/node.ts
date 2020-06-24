import { store } from "store";
import Immutable from "immutable";

export const getNodeLabels = (): Immutable.List<string> => {
  const state = store.getState();

  return state.get("nodes").get("labels");
};
