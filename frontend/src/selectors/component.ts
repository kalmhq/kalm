import { formValueSelector, isDirty } from "redux-form/immutable";
import { store } from "../store";

export const getComponentVolumeType = (member: string): string => {
  const state = store.getState();

  const selector = formValueSelector("componentLike");
  return selector(state, `${member}.type`);
};

export const isDirtyField = (field: string): boolean => {
  const state = store.getState();

  return isDirty("componentLike")(state, field);
};

export const getComponentPluginName = (member: string): string => {
  const state = store.getState();

  const selector = formValueSelector("componentLike");
  return selector(state, `${member}.name`);
};

export const getApplicationPluginName = (member: string): string => {
  const state = store.getState();

  const selector = formValueSelector("application");
  return selector(state, `${member}.name`);
};
