import Immutable from "immutable";
import { Actions } from "../types";
import { ImmutableMap } from "../typings";
import { LOGOUT } from "../types/common";
import {
  LOAD_PERSISTENT_VOLUMNS,
  LOAD_STORAGE_CLASSES,
  PersistentVolumes,
  StorageClasses
} from "../types/persistentVolume";

export type State = ImmutableMap<{
  persistentVolumes: PersistentVolumes;
  storageClasses: StorageClasses;
}>;

const initialState: State = Immutable.Map({
  persistentVolumes: [],
  storageClasses: []
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case LOAD_PERSISTENT_VOLUMNS: {
      return state.set("persistentVolumes", action.payload.persistentVolumes);
    }
    case LOAD_STORAGE_CLASSES: {
      return state.set("storageClasses", action.payload.storageClasses);
    }
  }

  return state;
};

export default reducer;
