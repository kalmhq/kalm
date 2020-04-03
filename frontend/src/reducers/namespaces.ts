import Immutable from "immutable";
import { Actions } from "../types";
import { LOAD_NAMESPACES, Namespaces, CREATE_NAMESPACE_FULFILLED, CREATE_NAMESPACE_PENDING } from "../types/namespace";
import { ImmutableMap } from "../typings";

export type State = ImmutableMap<{
  namespaces: Namespaces;
  active: string;
  isCreating: boolean;
}>;

const initialState: State = Immutable.Map({
  namespaces: Immutable.List(),
  active: "",
  isCreating: false
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_NAMESPACES: {
      return state.set("namespaces", action.payload.namespaces);
    }
    case CREATE_NAMESPACE_FULFILLED: {
      return state.set("isCreating", false);
    }
    case CREATE_NAMESPACE_PENDING: {
      return state.set("isCreating", true);
    }
  }

  return state;
};

export default reducer;
