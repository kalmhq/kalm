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
          .get("statefulSetOptions")
          .filter((statefulSetOption) => statefulSetOption.get("componentName") === componentName)
      : state.get("persistentVolumes").get("simpleOptions");

  return volumeOptions;
};
