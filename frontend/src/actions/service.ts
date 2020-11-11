import { ThunkResult } from "types";
import { LOAD_SERVICES_FAILED, LOAD_SERVICES_FULFILLED, LOAD_SERVICES_PENDING } from "types/service";
import { api } from "api";

export const loadServicesAction = (namespace: string): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    // for withData reloadResouces
    const { token, impersonation } = getState().auth;
    if (!token && !impersonation) {
      return;
    }

    dispatch({ type: LOAD_SERVICES_PENDING });

    try {
      const services = await api.loadServices(namespace);

      dispatch({
        type: LOAD_SERVICES_FULFILLED,
        payload: {
          services: services,
        },
      });
    } catch (e) {
      dispatch({ type: LOAD_SERVICES_FAILED });
      throw e;
    }
  };
};
