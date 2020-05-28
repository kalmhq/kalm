import Immutable from "immutable";
import { Actions } from "../types";
import { ImmutableMap } from "../typings";
import { LOAD_CERTFICATES_FAILED, LOAD_CERTFICATES_PENDING, CertficateList } from "types/certficate";

export type State = ImmutableMap<{
  isLoading: boolean;
  isFirstLoaded: boolean;
  list: CertficateList;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  isFirstLoaded: false,
  list: Immutable.List()
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_CERTFICATES_PENDING: {
      return state.set("isLoading", true);
    }
    case LOAD_CERTFICATES_FAILED: {
      return state.set("isLoading", false);
    }
  }

  return state;
};

export default reducer;
