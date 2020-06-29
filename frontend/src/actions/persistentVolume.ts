import { ThunkResult } from "../types";
import {
  DELETE_PERSISTENT_VOLUME,
  LOAD_PERSISTENT_VOLUMES,
  LOAD_STORAGE_CLASSES,
  LOAD_SIMPLE_OPTIONS,
  LOAD_STATEFULSET_OPTIONS,
} from "../types/persistentVolume";
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

export const deletePersistentVolumeAction = (namespace: string, name: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    await api.deletePersistentVolume(namespace, name);

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

export const loadSimpleOptionsAction = (namespace?: string): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    if (!namespace) {
      namespace = getState().get("namespaces").get("active");
    }

    const simpleOptions = await api.getSimpleOptions(namespace);

    dispatch({
      type: LOAD_SIMPLE_OPTIONS,
      payload: { simpleOptions },
    });
  };
};

export const loadStatefulSetOptionsAction = (namespace?: string): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    if (!namespace) {
      namespace = getState().get("namespaces").get("active");
    }

    const statefulSetOptions = await api.getSimpleOptions(namespace);

    dispatch({
      type: LOAD_STATEFULSET_OPTIONS,
      payload: { statefulSetOptions },
    });
  };
};
