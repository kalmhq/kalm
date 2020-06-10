import { getPersistentVolumes, getStorageClasses } from "./kubernetesApi";
import { ThunkResult } from "../types";
import { LOAD_PERSISTENT_VOLUMNS, LOAD_STORAGE_CLASSES } from "../types/persistentVolume";

export const loadPersistentVolumes = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const persistentVolumes = await getPersistentVolumes();

    dispatch({
      type: LOAD_PERSISTENT_VOLUMNS,
      payload: { persistentVolumes }
    });
  };
};

export const loadStorageClasses = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const storageClasses = await getStorageClasses();

    dispatch({
      type: LOAD_STORAGE_CLASSES,
      payload: { storageClasses }
    });
  };
};
