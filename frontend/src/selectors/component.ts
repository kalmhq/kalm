import { formValueSelector, isDirty } from "redux-form/immutable";
import { store } from "store";
import { APPLICATION_FORM_ID, COMPONENT_FORM_ID } from "forms/formIDs";

export const getComponentVolumeType = (member: string): string => {
  const state = store.getState();

  const selector = formValueSelector(COMPONENT_FORM_ID);
  return selector(state, `${member}.type`);
};

export const isDirtyField = (field: string): boolean => {
  const state = store.getState();

  return isDirty(COMPONENT_FORM_ID)(state, field);
};

export const getComponentPluginName = (member: string): string => {
  const state = store.getState();

  const selector = formValueSelector(COMPONENT_FORM_ID);
  return selector(state, `${member}.name`);
};

export const getApplicationPluginName = (member: string): string => {
  const state = store.getState();

  const selector = formValueSelector(APPLICATION_FORM_ID);
  return selector(state, `${member}.name`);
};
