import { api } from "api";
import { ThunkResult } from "types";
import {
  LOAD_CLUSTER_INFO_FAILED,
  LOAD_CLUSTER_INFO_FULFILLED,
  LOAD_CLUSTER_INFO_PENDING,
  LOAD_EXTRA_INFO_FAILED,
  LOAD_EXTRA_INFO_FULFILLED,
  LOAD_EXTRA_INFO_PENDING,
  LOAD_TENANT_INFO_FAILED,
  LOAD_TENANT_INFO_FULFILLED,
  LOAD_TENANT_INFO_PENDING,
} from "types/cluster";

export const loadClusterInfoAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_CLUSTER_INFO_PENDING });

    try {
      const info = await api.getClusterInfo();

      dispatch({
        type: LOAD_CLUSTER_INFO_FULFILLED,
        payload: info,
      });
    } catch (e) {
      dispatch({ type: LOAD_CLUSTER_INFO_FAILED });
      throw e;
    }
  };
};

export const loadCurrentTenantInfoAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_TENANT_INFO_PENDING });

    try {
      const info = await api.getCurrentTenant();

      dispatch({
        type: LOAD_TENANT_INFO_FULFILLED,
        payload: info,
      });
    } catch (e) {
      dispatch({ type: LOAD_TENANT_INFO_FAILED });
      throw e;
    }
  };
};

export const loadExtraInfoAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_EXTRA_INFO_PENDING });

    try {
      const info = await api.loadExtraInfo();

      dispatch({
        type: LOAD_EXTRA_INFO_FULFILLED,
        payload: info,
      });
    } catch (e) {
      dispatch({ type: LOAD_EXTRA_INFO_FAILED });
      throw e;
    }
  };
};
