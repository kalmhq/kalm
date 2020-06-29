import { ThunkResult } from "../types";
import { DELETE_PERSISTENT_VOLUME, LOAD_PERSISTENT_VOLUMES, LOAD_STORAGE_CLASSES } from "types/disk";
import { api } from "api";

export const loadPersistentVolumesAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    const persistentVolumes = await api.getPersistentVolumes();

    dispatch({
      type: LOAD_PERSISTENT_VOLUMES,
      payload: { persistentVolumes },
    });
  };
};

export const deletePersistentVolumeAction = (name: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    await api.deletePersistentVolume(name);

    dispatch({
      type: DELETE_PERSISTENT_VOLUME,
      payload: { name },
    });
  };
};

export const loadStorageClassesAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    const storageClasses = await api.getStorageClasses();

    dispatch({
      type: LOAD_STORAGE_CLASSES,
      payload: { storageClasses },
    });
  };
};
