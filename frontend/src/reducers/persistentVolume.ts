import Immutable from "immutable";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import { LOGOUT } from "types/common";
import {
  DELETE_PERSISTENT_VOLUME,
  LOAD_PERSISTENT_VOLUMES,
  LOAD_STORAGE_CLASSES,
  PersistentVolumes,
  StorageClasses,
  VolumeOptions,
  LOAD_SIMPLE_OPTIONS,
  LOAD_STATEFULSET_OPTIONS,
} from "types/disk";
import {
  RESOURCE_TYPE_VOLUME,
  WATCHED_RESOURCE_CHANGE,
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
} from "types/resources";
import { addOrUpdateInList, removeInList, removeInListByName } from "./utils";

export type State = ImmutableMap<{
  persistentVolumes: PersistentVolumes;
  storageClasses: StorageClasses;
  simpleOptions: VolumeOptions; // for simple workloads, including: Deployment, CronJob and DaemonSet
  statefulSetOptions: VolumeOptions; // for StatefulSet
}>;

const initialState: State = Immutable.Map({
  persistentVolumes: Immutable.List([]),
  storageClasses: Immutable.List([]),
  simpleOptions: Immutable.List([]),
  statefulSetOptions: Immutable.List([]),
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_PERSISTENT_VOLUMES: {
      return state.set("persistentVolumes", action.payload.persistentVolumes);
    }
    case LOAD_STORAGE_CLASSES: {
      return state.set("storageClasses", action.payload.storageClasses);
    }
    case DELETE_PERSISTENT_VOLUME: {
      state = state.update("persistentVolumes", (x) => removeInListByName(x, action.payload.name));
      return state;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_VOLUME) {
        return state;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state = state.update("persistentVolumes", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state = state.update("persistentVolumes", (x) => removeInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state = state.update("persistentVolumes", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
      }

      break;
    }
    case LOAD_SIMPLE_OPTIONS: {
      return state.set("simpleOptions", action.payload.simpleOptions);
    }
    case LOAD_STATEFULSET_OPTIONS: {
      return state.set("statefulSetOptions", action.payload.statefulSetOptions);
    }
  }

  return state;
};

export default reducer;
