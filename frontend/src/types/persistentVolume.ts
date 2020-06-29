import { ImmutableMap } from "typings";
import Immutable from "immutable";

export const LOAD_PERSISTENT_VOLUMES = "LOAD_PERSISTENT_VOLUMES";
export const DELETE_PERSISTENT_VOLUME = "DELETE_PERSISTENT_VOLUME";
export const LOAD_STORAGE_CLASSES = "LOAD_STORAGE_CLASSES";
export const LOAD_SIMPLE_OPTIONS = "LOAD_SIMPLE_OPTIONS";
export const LOAD_STATEFULSET_OPTIONS = "LOAD_STATEFULSET_OPTIONS";

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

export interface VolumeOptionContent {
  name: string;
  isInUse: boolean;
  componentNamespace?: string;
  componentName?: string;
  capacity: string;
  pvc: string;
  pvToMatch: string;
}
export type VolumeOption = ImmutableMap<VolumeOptionContent>;
export type VolumeOptions = Immutable.List<VolumeOption>;

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

export interface LoadSimpleOptionsAction {
  type: typeof LOAD_SIMPLE_OPTIONS;
  payload: {
    simpleOptions: VolumeOptions;
  };
}

export interface LoadStatefulSetOptionsAction {
  type: typeof LOAD_STATEFULSET_OPTIONS;
  payload: {
    statefulSetOptions: VolumeOptions;
  };
}

export type VolumeActions =
  | LoadPersistentVolumesAction
  | DeletePersistentVolumeAction
  | LoadStorageClassesAction
  | LoadSimpleOptionsAction
  | LoadStatefulSetOptionsAction;
