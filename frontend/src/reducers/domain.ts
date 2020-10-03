import produce from "immer";
import { Actions } from "types";
import {
  Domain,
  INIT_DOMAIN_STATUS,
  LOADED_DOMAIN_STATUS,
  SET_DOMAIN_A_RECORDS,
  SET_DOMAIN_CNAME,
  SET_DOMAIN_NS,
} from "types/domain";

export type State = { [key: string]: Domain };

export let initialState: State = {};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case INIT_DOMAIN_STATUS: {
      const { domain } = action.payload;
      const currentDomain = state[domain];
      if (!currentDomain) {
        state[domain] = { domain, isLoaded: false } as Domain;
      }
      return;
    }
    case LOADED_DOMAIN_STATUS: {
      const { domain } = action.payload;
      if (state[domain]) {
        state[domain].isLoaded = true;
      } else {
        state[domain] = { domain, isLoaded: true } as Domain;
      }
      return state;
    }
    case SET_DOMAIN_A_RECORDS: {
      const { domain, aRecords } = action.payload;
      if (state[domain]) {
        state[domain].aRecords = aRecords;
      } else {
        state[domain] = {
          domain,
          aRecords,
        } as Domain;
      }
      return;
    }
    case SET_DOMAIN_CNAME: {
      const { domain, cname } = action.payload;
      if (state[domain]) {
        state[domain].cname = cname;
      } else {
        state[domain] = {
          domain,
          cname,
        } as Domain;
      }
      return;
    }
    case SET_DOMAIN_NS: {
      const { domain, ns } = action.payload;
      if (state[domain]) {
        state[domain].ns = ns;
      } else {
        state[domain] = {
          domain,
          ns,
        } as Domain;
      }
      return state;
    }
  }

  return state;
}, initialState);

export default reducer;
