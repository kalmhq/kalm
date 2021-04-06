import { RootState } from "store";
import { workloadTypeStatefulSet } from "types/componentTemplate";

export const getComponentFormVolumeOptions = (
  state: RootState,
  componentName: string,
  componentWorkloadType: string,
) => {
  const volumeOptions =
    componentWorkloadType === workloadTypeStatefulSet
      ? state.persistentVolumes.statefulSetOptions.filter(
          (statefulSetOption) => statefulSetOption.componentName === componentName,
        )
      : state.persistentVolumes.simpleOptions;

  return volumeOptions;
};
