import Immutable from "immutable";
import { Actions } from "types";
import { SET_DOMAIN_A_RECORDS, DomainType, SET_DOMAIN_CNAME } from "types/domain";

export type State = Immutable.Map<string, DomainType>;

export let initialState: State = Immutable.Map();

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case SET_DOMAIN_A_RECORDS: {
      const { domain, aRecords } = action.payload;
      return state.setIn([domain, "aRecords"], Immutable.List(aRecords));
    }
    case SET_DOMAIN_CNAME: {
      const { domain, cname } = action.payload;
      return state.setIn([domain, "cname"], cname);
    }
  }

  return state;
};

export default reducer;
