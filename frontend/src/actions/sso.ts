import { api } from "api";
import { ThunkResult } from "types";
import {
  CREATE_SSO_CONFIG_FAILED,
  CREATE_SSO_CONFIG_FULFILLED,
  CREATE_SSO_CONFIG_PENDING,
  LOAD_PROTECTED_ENDPOINTS_FAILED,
  LOAD_PROTECTED_ENDPOINTS_FULFILLED,
  LOAD_PROTECTED_ENDPOINTS_PENDING,
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
  return async (dispatch) => {
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
  return async (dispatch) => {
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

export const loadProtectedEndpointAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_PROTECTED_ENDPOINTS_PENDING });
    try {
      const endpoints = await api.listProtectedEndpoints();

      dispatch({
        type: LOAD_PROTECTED_ENDPOINTS_FULFILLED,
        payload: endpoints,
      });
    } catch (e) {
      dispatch({ type: LOAD_PROTECTED_ENDPOINTS_FAILED });
      throw e;
    }
  };
};
