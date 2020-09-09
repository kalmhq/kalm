import { RootState } from "reducers";
import { workloadTypeStatefulSet } from "types/componentTemplate";

export const getComponentFormVolumeOptions = (
  state: RootState,
  componentName: string,
  componentWorkloadType: string,
) => {
  const volumeOptions =
    componentWorkloadType === workloadTypeStatefulSet
      ? state
          .get("persistentVolumes")
          .statefulSetOptions.filter((statefulSetOption) => statefulSetOption.componentName === componentName)
      : state.get("persistentVolumes").simpleOptions;

  return volumeOptions;
};
