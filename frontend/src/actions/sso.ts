import { ThunkResult } from "types";
import { setErrorNotificationAction } from "./notification";
import { api } from "api";
import {
  CREATE_SSO_CONFIG_FAILED,
  CREATE_SSO_CONFIG_FULFILLED,
  CREATE_SSO_CONFIG_PENDING,
  DELETE_SSO_CONFIG_FAILED,
  DELETE_SSO_CONFIG_FULFILLED,
  DELETE_SSO_CONFIG_PENDING,
  LOAD_SSO_CONFIG_FAILED,
  LOAD_SSO_CONFIG_FULFILLED,
  LOAD_SSO_CONFIG_PENDING,
  SSOConfig,
  UPDATE_SSO_CONFIG_FAILED,
  UPDATE_SSO_CONFIG_FULFILLED,
  UPDATE_SSO_CONFIG_PENDING,
} from "types/sso";

export const loadSSOConfigAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_SSO_CONFIG_PENDING });
    try {
      const ssoConfig = await api.getSSOConfig();

      dispatch({
        type: LOAD_SSO_CONFIG_FULFILLED,
        payload: ssoConfig,
      });
    } catch (e) {
      dispatch({ type: LOAD_SSO_CONFIG_FAILED });
      throw e;
    }
  };
};

export const createSSOConfigAction = (ssoConfig: SSOConfig): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: CREATE_SSO_CONFIG_PENDING });

      const ssoConfigRes = await api.createSSOConfig(ssoConfig);

      dispatch({
        type: CREATE_SSO_CONFIG_FULFILLED,
        payload: ssoConfigRes,
      });
    } catch (e) {
      dispatch({ type: CREATE_SSO_CONFIG_FAILED });
      throw e;
    }
  };
};

export const updateSSOConfigAction = (ssoConfig: SSOConfig): ThunkResult<Promise<SSOConfig>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: UPDATE_SSO_CONFIG_PENDING });

      const ssoConfigRes = await api.updateSSOConfig(ssoConfig);
      dispatch({
        type: UPDATE_SSO_CONFIG_FULFILLED,
        payload: ssoConfigRes,
      });

      return ssoConfig;
    } catch (e) {
      dispatch({ type: UPDATE_SSO_CONFIG_FAILED });
      throw e;
    }
  };
};

export const deleteSSOConfigAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: DELETE_SSO_CONFIG_PENDING });
      await api.deleteSSOConfig();
      dispatch({ type: DELETE_SSO_CONFIG_FULFILLED });
    } catch (e) {
      dispatch({ type: DELETE_SSO_CONFIG_FAILED });
      dispatch(setErrorNotificationAction("Delete SSO Config failed."));
      throw e;
    }
  };
};
