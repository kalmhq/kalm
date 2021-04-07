import produce from "immer";
import { Actions } from "types";
import { LOGOUT } from "types/common";
import {
  DELETE_PERSISTENT_VOLUME,
  LOAD_PERSISTENT_VOLUMES,
  LOAD_SIMPLE_OPTIONS,
  LOAD_STATEFULSET_OPTIONS,
  LOAD_STORAGE_CLASSES,
  PersistentVolumes,
  StorageClasses,
  VolumeOptions,
} from "types/disk";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_VOLUME,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import { addOrUpdateInArray, removeInArray, removeInArrayByName } from "./utils";

type State = {
  persistentVolumes: PersistentVolumes;
  storageClasses: StorageClasses;
  simpleOptions: VolumeOptions; // for simple workloads, including: Deployment, CronJob and DaemonSet
  statefulSetOptions: VolumeOptions; // for StatefulSet
};

const initialState: State = {
  persistentVolumes: [],
  storageClasses: [],
  simpleOptions: [],
  statefulSetOptions: [],
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_PERSISTENT_VOLUMES: {
      state.persistentVolumes = action.payload.persistentVolumes;
      return;
    }
    case LOAD_STORAGE_CLASSES: {
      state.storageClasses = action.payload.storageClasses;
      return;
    }
    case DELETE_PERSISTENT_VOLUME: {
      state.persistentVolumes = removeInArrayByName(state.persistentVolumes, action.payload.name);
      return;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_VOLUME) {
        return;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state.persistentVolumes = addOrUpdateInArray(state.persistentVolumes, action.payload.data);
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state.persistentVolumes = removeInArray(state.persistentVolumes, action.payload.data);
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state.persistentVolumes = addOrUpdateInArray(state.persistentVolumes, action.payload.data);
          break;
        }
      }

      return;
    }
    case LOAD_SIMPLE_OPTIONS: {
      state.simpleOptions = action.payload.simpleOptions;
      return;
    }
    case LOAD_STATEFULSET_OPTIONS: {
      state.statefulSetOptions = action.payload.statefulSetOptions;
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
