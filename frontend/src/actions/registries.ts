import { api } from "api";
import { ThunkResult } from "types";
import { CREATE_REGISTRY, DELETE_REGISTRY, Registry, RegistryFormType, UPDATE_REGISTRY } from "types/registry";

export const createRegistryAction = (registryValues: RegistryFormType): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    let registry: Registry;
    try {
      registry = await api.createRegistry(registryValues);
    } catch (e) {
      throw e;
    }

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
    let registry: Registry;
    try {
      registry = await api.updateRegistry(registryValues);
    } catch (e) {
      throw e;
    }

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
