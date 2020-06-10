import { ImmutableMap } from "typings";
import Immutable from "immutable";

export const LOAD_PERSISTENT_VOLUMNS = "LOAD_PERSISTENT_VOLUMNS";
export const LOAD_STORAGE_CLASSES = "LOAD_STORAGE_CLASSES";

export interface PersistentVolumeContent {
  name: string;
  isAvailable: boolean;
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
  type: typeof LOAD_PERSISTENT_VOLUMNS;
  payload: {
    persistentVolumes: PersistentVolumes;
  };
}

export interface LoadStorageClassesAction {
  type: typeof LOAD_STORAGE_CLASSES;
  payload: {
    storageClasses: StorageClasses;
  };
}

export type VolumeActions = LoadPersistentVolumesAction | LoadStorageClassesAction;
