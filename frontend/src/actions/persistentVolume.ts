import { deletePersistentVolume, getPersistentVolumes, getStorageClasses } from "./kubernetesApi";
import { ThunkResult } from "../types";
import { DELETE_PERSISTENT_VOLUME, LOAD_PERSISTENT_VOLUMES, LOAD_STORAGE_CLASSES } from "../types/persistentVolume";

export const loadPersistentVolumesAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    const persistentVolumes = await getPersistentVolumes();

    dispatch({
      type: LOAD_PERSISTENT_VOLUMES,
      payload: { persistentVolumes },
    });
  };
};

export const deletePersistentVolumeAction = (name: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    await deletePersistentVolume(name);

    dispatch({
      type: DELETE_PERSISTENT_VOLUME,
      payload: { name },
    });
  };
};

export const loadStorageClassesAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    const storageClasses = await getStorageClasses();

    dispatch({
      type: LOAD_STORAGE_CLASSES,
      payload: { storageClasses },
    });
  };
};
