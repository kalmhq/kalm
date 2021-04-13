import { api } from "api";
import { ThunkResult } from "types";
import { Registry, RegistryFormType, UPDATE_REGISTRY } from "types/registry";

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
