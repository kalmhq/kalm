import { APPLICATION_FORM_ID, COMPONENT_FORM_ID } from "forms/formIDs";
import { formValueSelector } from "redux-form/immutable";
import { store } from "store";
import { workloadTypeStatefulSet } from "types/componentTemplate";
import { RootState } from "reducers";

export const getComponentFormVolumeOptions = (
  state: RootState,
  componentName?: string,
  componentWorkloadType?: string,
) => {
  const selector = formValueSelector(COMPONENT_FORM_ID);
  componentName = componentName || selector(state, "name");
  componentWorkloadType = componentWorkloadType || selector(state, "workloadType");

  const volumeOptions =
    componentWorkloadType === workloadTypeStatefulSet
      ? state
          .get("persistentVolumes")
          .get("statefulSetOptions")
          .filter((statefulSetOption) => statefulSetOption.get("componentName") === componentName)
      : state.get("persistentVolumes").get("simpleOptions");

  return volumeOptions;
};

export const getComponentFormPluginName = (member: string): string => {
  const state = store.getState();

  const selector = formValueSelector(COMPONENT_FORM_ID);
  return selector(state, `${member}.name`);
};

export const getApplicationFormPluginName = (member: string): string => {
  const state = store.getState();

  const selector = formValueSelector(APPLICATION_FORM_ID);
  return selector(state, `${member}.name`);
};
