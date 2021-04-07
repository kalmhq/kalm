import { getIn } from "final-form";
import { APPLICATION_FORM_ID, CERTIFICATE_FORM_ID, COMPONENT_FORM_ID } from "forms/formIDs";
import { State as TutorialState } from "reducers/tutorial";
import { RootState } from "store";

export const finalValidateOrNotBlockByTutorial = (
  values: { [key: string]: any },
  tutorialState: TutorialState,
  form: string,
) => {
  const errors: { [key: string]: any } = {};
  const state = tutorialState;

  if (!tutorialState) {
    return errors;
  }

  const tutorial = tutorialState.tutorial;
  if (!tutorial) {
    return errors;
  }

  const currentStep = tutorial.steps[state.currentStepIndex];
  if (!currentStep) {
    return errors;
  }

  for (let i = 0; i < currentStep.subSteps.length; i++) {
    const subStep = currentStep.subSteps[i];

    if (subStep.formValidator) {
      for (let j = 0; j < subStep.formValidator.length; j++) {
        const rule = subStep.formValidator[j];
        if (rule.form === form) {
          const error = rule.validate(getIn(values, rule.field));

          if (error) {
            errors[rule.field] = error;
          }
        }
      }
    }
  }

  return errors;
};

export const requireSubStepNotCompleted = (state: RootState, ...subStepIndexes: number[]) => {
  const tutorialState = state.tutorial;

  const tutorial = tutorialState.tutorial;
  if (!tutorial) return false;

  const currentStep = tutorial.steps[tutorialState.currentStepIndex];
  if (!currentStep) return false;

  for (let i = 0; i < subStepIndexes.length; i++) {
    if (tutorialState.tutorialStepStatus[`${tutorialState.currentStepIndex}-${subStepIndexes[i]}`]) {
      return false;
    }

    const subStep = currentStep.subSteps[subStepIndexes[i]];
    if (subStep && subStep.shouldCompleteByState && subStep.shouldCompleteByState(state)) {
      return false;
    }
  }

  return true;
};

export const requireSubStepCompleted = (state: RootState, ...subStepIndexes: number[]) => {
  const tutorialState = state.tutorial;

  const tutorial = tutorialState.tutorial;
  if (!tutorial) return false;

  const currentStep = tutorial.steps[tutorialState.currentStepIndex];
  if (!currentStep) return false;

  for (let i = 0; i < subStepIndexes.length; i++) {
    if (!tutorialState.tutorialStepStatus[`${tutorialState.currentStepIndex}-${subStepIndexes[i]}`]) {
      return false;
    }

    const subStep = currentStep.subSteps[subStepIndexes[i]];
    if (subStep && subStep.shouldCompleteByState && !subStep.shouldCompleteByState(state)) {
      return false;
    }
  }

  return true;
};

export const getFormValue = (rootState: RootState, form: string, field: string) => {
  const formValuesMap = rootState.tutorial.formValues;
  const formValues = formValuesMap ? formValuesMap[form] : undefined;
  if (!formValues) {
    return undefined;
  }
  return getIn(formValues, field);
};

export const isFormFieldValueEqualTo = (rootState: RootState, form: string, field: string, value: any) => {
  const formValuesMap = rootState.tutorial.formValues;
  const formValues = formValuesMap ? formValuesMap[form] : undefined;

  if (!formValues) {
    return false;
  }
  return Array.isArray(getIn(formValues, field))
    ? getIn(formValues, field)[0] === value[0]
    : getIn(formValues, field) === value;
};

export const isFormFieldMeet = (rootState: RootState, form: string, field: string, cb: (value: any) => boolean) => {
  const value = getFormValue(rootState, form, field);
  return !!value && cb(value);
};

export const isApplicationFormFieldValueEqualTo = (rootState: RootState, field: string, value: string) => {
  return isFormFieldValueEqualTo(rootState, APPLICATION_FORM_ID, field, value);
};

export const isComponentFormFieldValueEqualTo = (rootState: RootState, field: string, value: string) => {
  return isFormFieldValueEqualTo(rootState, COMPONENT_FORM_ID, field, value);
};

const isCertificateFormFieldValueEqualTo = (rootState: RootState, field: string, value: any) => {
  return isFormFieldValueEqualTo(rootState, CERTIFICATE_FORM_ID, field, value);
};

export const isUnderPath = (state: RootState, ...paths: string[]) => {
  const pathname = window.location.pathname as string;

  return paths.includes(pathname);
};

export const popupTitle = "Click Here";
