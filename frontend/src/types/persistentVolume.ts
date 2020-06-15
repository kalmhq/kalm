import { ImmutableMap } from "typings";
import Immutable from "immutable";

export const LOAD_PERSISTENT_VOLUMES = "LOAD_PERSISTENT_VOLUMES";
export const DELETE_PERSISTENT_VOLUME = "DELETE_PERSISTENT_VOLUME";
export const LOAD_STORAGE_CLASSES = "LOAD_STORAGE_CLASSES";

export interface PersistentVolumeContent {
  name: string;
  isInUse: boolean;
  componentNamespace?: string;
  componentName?: string;
  phase: string;
  capacity: string;
}

export type PersistentVolume = ImmutableMap<PersistentVolumeContent>;
export type PersistentVolumes = Immutable.List<PersistentVolume>;

export interface StorageClassContent {
  name: string;
  isKappManaged: boolean;
}

export type StorageClass = ImmutableMap<StorageClassContent>;
export type StorageClasses = Immutable.List<StorageClass>;

export interface LoadPersistentVolumesAction {
  type: typeof LOAD_PERSISTENT_VOLUMES;
  payload: {
    persistentVolumes: PersistentVolumes;
  };
}

export interface DeletePersistentVolumeAction {
  type: typeof DELETE_PERSISTENT_VOLUME;
  payload: {
    name: string;
  };
}

export interface LoadStorageClassesAction {
  type: typeof LOAD_STORAGE_CLASSES;
  payload: {
    storageClasses: StorageClasses;
  };
}

export type VolumeActions = LoadPersistentVolumesAction | DeletePersistentVolumeAction | LoadStorageClassesAction;
