import produce from "immer";
import { Actions } from "types";
import {
  DomainForCheck,
  INIT_DOMAIN_STATUS,
  LOADED_DOMAIN_STATUS,
  SET_DOMAIN_A_RECORDS,
  SET_DOMAIN_CNAME,
  SET_DOMAIN_NS,
} from "types/domain";

export type State = { [key: string]: DomainForCheck };

export let initialState: State = {};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case INIT_DOMAIN_STATUS: {
      const { domain } = action.payload;
      const currentDomain = state[domain];
      if (!currentDomain) {
        state[domain] = { domain, isLoaded: false } as DomainForCheck;
      }
      return;
    }
    case LOADED_DOMAIN_STATUS: {
      const { domain } = action.payload;
      if (state[domain]) {
        state[domain].isLoaded = true;
      } else {
        state[domain] = { domain, isLoaded: true } as DomainForCheck;
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
        } as DomainForCheck;
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
        } as DomainForCheck;
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
        } as DomainForCheck;
      }
      return state;
    }
  }

  return state;
}, initialState);

export default reducer;
