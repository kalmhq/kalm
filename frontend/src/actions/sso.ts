import { ThunkResult } from "types";
import { setErrorNotificationAction } from "./notification";
import { api } from "api";
import {
  CREATE_PROTECTED_ENDPOINT_FAILED,
  CREATE_PROTECTED_ENDPOINT_FULFILLED,
  CREATE_PROTECTED_ENDPOINT_PENDING,
  CREATE_SSO_CONFIG_FAILED,
  CREATE_SSO_CONFIG_FULFILLED,
  CREATE_SSO_CONFIG_PENDING,
  DELETE_PROTECTED_ENDPOINT_FAILED,
  DELETE_PROTECTED_ENDPOINT_FULFILLED,
  DELETE_PROTECTED_ENDPOINT_PENDING,
  DELETE_SSO_CONFIG_FAILED,
  DELETE_SSO_CONFIG_FULFILLED,
  DELETE_SSO_CONFIG_PENDING,
  LOAD_PROTECTED_ENDPOINTS_FAILED,
  LOAD_PROTECTED_ENDPOINTS_FULFILLED,
  LOAD_PROTECTED_ENDPOINTS_PENDING,
  LOAD_SSO_CONFIG_FAILED,
  LOAD_SSO_CONFIG_FULFILLED,
  LOAD_SSO_CONFIG_PENDING,
  ProtectedEndpoint,
  SSOConfig,
  UPDATE_PROTECTED_ENDPOINT_FAILED,
  UPDATE_PROTECTED_ENDPOINT_FULFILLED,
  UPDATE_PROTECTED_ENDPOINT_PENDING,
  UPDATE_SSO_CONFIG_FAILED,
  UPDATE_SSO_CONFIG_FULFILLED,
  UPDATE_SSO_CONFIG_PENDING,
} from "types/sso";
import Immutable from "immutable";

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

export const createProtectedEndpointAction = (protectedEndpointForm: ProtectedEndpoint): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: CREATE_PROTECTED_ENDPOINT_PENDING });

      let protectedEndpoint: ProtectedEndpoint = Immutable.fromJS(protectedEndpointForm);
      const protectedEndpointRes = await api.createProtectedEndpoint(protectedEndpoint);

      dispatch({
        type: CREATE_PROTECTED_ENDPOINT_FULFILLED,
        payload: protectedEndpointRes,
      });
    } catch (e) {
      dispatch({ type: CREATE_PROTECTED_ENDPOINT_FAILED });
      throw e;
    }
  };
};

export const updateProtectedEndpointAction = (protectedEndpointForm: ProtectedEndpoint): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: UPDATE_PROTECTED_ENDPOINT_PENDING });

      let protectedEndpoint: ProtectedEndpoint = Immutable.fromJS(protectedEndpointForm);
      const protectedEndpointRes = await api.updateProtectedEndpoint(protectedEndpoint);

      dispatch({
        type: UPDATE_PROTECTED_ENDPOINT_FULFILLED,
        payload: protectedEndpointRes,
      });
    } catch (e) {
      dispatch({ type: UPDATE_PROTECTED_ENDPOINT_FAILED });
      throw e;
    }
  };
};

export const deleteProtectedEndpointAction = (protectedEndpoint: ProtectedEndpoint): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      dispatch({ type: DELETE_PROTECTED_ENDPOINT_PENDING });
      await api.deleteProtectedEndpoint(protectedEndpoint);
      dispatch({ type: DELETE_PROTECTED_ENDPOINT_FULFILLED });
    } catch (e) {
      dispatch({ type: DELETE_PROTECTED_ENDPOINT_FAILED });
      dispatch(setErrorNotificationAction("Delete Protected Endpoint failed."));
      throw e;
    }
  };
};
