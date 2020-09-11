import Immutable from "immutable";
import { Actions } from "types";
import {
  SET_DOMAIN_A_RECORDS,
  DomainType,
  SET_DOMAIN_CNAME,
  SET_DOMAIN_NS,
  INIT_DOMAIN_STATUS,
  LOADED_DOMAIN_STATUS,
} from "types/domain";

export type State = Immutable.Map<string, DomainType>;

export let initialState: State = Immutable.Map();

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case INIT_DOMAIN_STATUS: {
      const { domain } = action.payload;
      const currentDomain = state.get(domain);
      if (!currentDomain) {
        state = state.set(domain, Immutable.Map({ domain }));
        state = state.setIn([domain, "isLoaded"], false);
      }
      return state;
    }
    case LOADED_DOMAIN_STATUS: {
      const { domain } = action.payload;
      state = state.setIn([domain, "isLoaded"], true);
      return state;
    }
    case SET_DOMAIN_A_RECORDS: {
      const { domain, aRecords } = action.payload;
      state = state.setIn([domain, "aRecords"], Immutable.List(aRecords));
      return state;
    }
    case SET_DOMAIN_CNAME: {
      const { domain, cname } = action.payload;
      state = state.setIn([domain, "cname"], cname);
      return state;
    }
    case SET_DOMAIN_NS: {
      const { domain, ns } = action.payload;
      state = state.setIn([domain, "ns"], Immutable.List(ns));
      return state;
    }
  }

  return state;
};

export default reducer;
