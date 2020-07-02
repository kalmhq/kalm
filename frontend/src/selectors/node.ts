import Immutable from "immutable";
import { RootState } from "reducers";

export const getNodeLabels = (state: RootState): Immutable.List<string> => {
  return state.get("nodes").get("labels");
};
