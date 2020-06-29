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
} from "types/persistentVolume";

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
      const persistentVolumes = state.get("persistentVolumes");
      const index = persistentVolumes.findIndex((v) => v.get("name") === action.payload.name);

      if (index >= 0) {
        state = state.deleteIn(["persistentVolumes", index]);
      }
      return state;
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
