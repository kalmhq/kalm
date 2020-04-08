import { getPersistentVolumes } from "./kubernetesApi";
import { ThunkResult } from "../types";
import { LOAD_PERSISTENT_VOLUMNS } from "../types/common";

export const loadPersistentVolumes = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const persistentVolumns = (await getPersistentVolumes()) as any[];

    dispatch({
      type: LOAD_PERSISTENT_VOLUMNS,
      payload: { persistentVolumns }
    });
  };
};
