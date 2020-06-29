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
} from "types/disk";

export type State = ImmutableMap<{
  persistentVolumes: PersistentVolumes;
  storageClasses: StorageClasses;
}>;

const initialState: State = Immutable.Map({
  persistentVolumes: [],
  storageClasses: [],
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
  }

  return state;
};

export default reducer;
