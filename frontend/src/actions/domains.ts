import { api } from "api";
import { ThunkResult } from "types";
import { LOAD_DOMAINS_FAILED, LOAD_DOMAINS_FULFILLED, LOAD_DOMAINS_PENDING } from "types/domains";

export const loadDomainsAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_DOMAINS_PENDING });

    try {
      const domains = await api.loadDomains();

      dispatch({
        type: LOAD_DOMAINS_FULFILLED,
        payload: {
          domains,
        },
      });
    } finally {
      dispatch({ type: LOAD_DOMAINS_FAILED });
    }
  };
};
