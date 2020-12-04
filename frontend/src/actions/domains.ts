import { api } from "api";
import { ThunkResult } from "types";
import {
  CREATE_DOMAIN_FAILED,
  CREATE_DOMAIN_FULFILLED,
  CREATE_DOMAIN_PENDING,
  DELETE_DOMAIN_FAILED,
  DELETE_DOMAIN_FULFILLED,
  DELETE_DOMAIN_PENDING,
  Domain,
  DomainCreation,
  LOAD_DOMAINS_FAILED,
  LOAD_DOMAINS_FULFILLED,
  LOAD_DOMAINS_PENDING,
} from "types/domains";

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
    } catch (e) {
      dispatch({ type: LOAD_DOMAINS_FAILED });
      throw e;
    }
  };
};

export const createDomainAction = (domainCreation: DomainCreation): ThunkResult<Promise<Domain>> => {
  return async (dispatch) => {
    dispatch({ type: CREATE_DOMAIN_PENDING });

    try {
      const domain = await api.createDomain(domainCreation);

      dispatch({
        type: CREATE_DOMAIN_FULFILLED,
        payload: {
          domain,
        },
      });

      return domain;
    } catch (e) {
      dispatch({ type: CREATE_DOMAIN_FAILED });
      throw e;
    }
  };
};

export const deleteDomainAction = (name: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: DELETE_DOMAIN_PENDING });

    try {
      await api.deleteDomain(name);

      dispatch({
        type: DELETE_DOMAIN_FULFILLED,
        payload: {
          name,
        },
      });
    } catch (e) {
      dispatch({ type: DELETE_DOMAIN_FAILED });
      throw e;
    }
  };
};
