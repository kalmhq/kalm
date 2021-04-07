import { api } from "api";
import { ThunkResult } from "types";
import {
  CREATE_REGISTRY,
  DELETE_REGISTRY,
  LOAD_REGISTRIES_FAILED,
  LOAD_REGISTRIES_FULFILLED,
  LOAD_REGISTRIES_PENDING,
  Registry,
  RegistryFormType,
  SetIsSubmittingRegistry,
  SET_IS_SUBMITTING_REGISTRY,
  UPDATE_REGISTRY,
} from "types/registry";

export const loadRegistriesAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_REGISTRIES_PENDING });
    try {
      const registries = await api.getRegistries();

      dispatch({
        type: LOAD_REGISTRIES_FULFILLED,
        payload: {
          registries,
        },
      });
    } catch (e) {
      dispatch({ type: LOAD_REGISTRIES_FAILED });
      throw e;
    }
  };
};

export const createRegistryAction = (registryValues: RegistryFormType): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch(setIsSubmittingRegistry(true));

    let registry: Registry;
    try {
      registry = await api.createRegistry(registryValues);
    } catch (e) {
      dispatch(setIsSubmittingRegistry(false));
      throw e;
    }
    dispatch(setIsSubmittingRegistry(false));

    dispatch({
      type: CREATE_REGISTRY,
      payload: {
        registry,
      },
    });
  };
};

export const updateRegistryAction = (registryValues: RegistryFormType): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch(setIsSubmittingRegistry(true));

    let registry: Registry;
    try {
      registry = await api.updateRegistry(registryValues);
    } catch (e) {
      dispatch(setIsSubmittingRegistry(false));
      throw e;
    }
    dispatch(setIsSubmittingRegistry(false));

    dispatch({
      type: UPDATE_REGISTRY,
      payload: {
        registry,
      },
    });
  };
};

export const deleteRegistryAction = (name: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    await api.deleteRegistry(name);

    dispatch({
      type: DELETE_REGISTRY,
      payload: {
        name,
      },
    });
  };
};

const setIsSubmittingRegistry = (isSubmittingRegistry: boolean): SetIsSubmittingRegistry => {
  return {
    type: SET_IS_SUBMITTING_REGISTRY,
    payload: {
      isSubmittingRegistry,
    },
  };
};
