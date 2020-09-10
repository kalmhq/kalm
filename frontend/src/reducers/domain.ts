import produce from "immer";
import { Actions } from "types";
import { Domain, INIT_DOMAIN_STATUS, SET_DOMAIN_A_RECORDS, SET_DOMAIN_CNAME } from "types/domain";

export type State = { [key: string]: Domain };

export let initialState: State = {};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case INIT_DOMAIN_STATUS: {
      const { domain } = action.payload;
      const currentDomain = state[domain];
      if (!currentDomain) {
        state[domain] = { domain } as Domain;
      }
      return;
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
  }

  return state;
}, initialState);

export default reducer;
