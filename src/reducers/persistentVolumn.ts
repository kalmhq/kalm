import Immutable from "immutable";
import { Actions, LOAD_PERSISTENT_VOLUMNS_ACTION } from "../actions";
import { ImmutableMap } from "../typings";

export type State = ImmutableMap<{
  persistentVolumns: kubernetes.PersistentVolumn.Item[];
}>;

const initialState: State = Immutable.Map({
  persistentVolumns: []
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_PERSISTENT_VOLUMNS_ACTION: {
      return state.set("persistentVolumns", action.payload.persistentVolumns);
    }
  }

  return state;
};

export default reducer;
