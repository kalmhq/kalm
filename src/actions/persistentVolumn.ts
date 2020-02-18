import { LOAD_PERSISTENT_VOLUMNS, ThunkResult } from ".";
import { getPersistentVolumes } from "./kubernetesApi";

export const loadPersistentVolumes = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const persistentVolumns = await getPersistentVolumes();

    dispatch({
      type: LOAD_PERSISTENT_VOLUMNS,
      payload: { persistentVolumns }
    });
  };
};
