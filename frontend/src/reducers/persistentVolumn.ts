import Immutable from "immutable";
import { Actions } from "../types";
import { ImmutableMap } from "../typings";
import { LOAD_PERSISTENT_VOLUMNS } from "../types/common";

export type State = ImmutableMap<{
  persistentVolumns: any[];
}>;

const initialState: State = Immutable.Map({
  persistentVolumns: []
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_PERSISTENT_VOLUMNS: {
      return state.set("persistentVolumns", action.payload.persistentVolumns);
    }
  }

  return state;
};

export default reducer;
