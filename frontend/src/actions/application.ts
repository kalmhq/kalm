import { deleteResource } from "api";
import { kalmToK8sNamespace } from "api/transformers";
import { SetIsSubmittingApplicationComponent, SET_IS_SUBMITTING_APPLICATION_COMPONENT } from "types/application";

export const deleteApplicationAction = (name: string) => {
  deleteResource(kalmToK8sNamespace({ name }));
};

export const setIsSubmittingApplicationComponentAction = (
  isSubmittingApplicationComponent: boolean,
): SetIsSubmittingApplicationComponent => {
  return {
    type: SET_IS_SUBMITTING_APPLICATION_COMPONENT,
    payload: {
      isSubmittingApplicationComponent,
    },
  };
};
