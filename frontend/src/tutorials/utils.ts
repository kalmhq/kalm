import Immutable from "immutable";
import { State as TutorialState } from "../reducers/tutorial";
import { RootState } from "reducers";
import { formValueSelector } from "redux-form/immutable";

export const formValidateOrNotBlockByTutorial = (
  values: Immutable.Map<string, any>,
  props: { tutorialState: TutorialState; form: string },
) => {
  const { tutorialState, form } = props;
  const errors: { [key: string]: any } = {};
  const state = tutorialState;
  if (!tutorialState) {
    return errors;
  }

  const tutorial = tutorialState.get("tutorial");
  if (!tutorial) {
    return errors;
  }

  const currentStep = tutorial.steps[state.get("currentStepIndex")];
  if (!currentStep) {
    return errors;
  }

  for (let i = 0; i < currentStep.subSteps.length; i++) {
    const subStep = currentStep.subSteps[i];

    if (subStep.formValidator) {
      for (let j = 0; j < subStep.formValidator.length; j++) {
        const rule = subStep.formValidator[j];
        if (rule.form === form) {
          const attrPath = rule.field.replace(/\]$/, "").split(/\[|\]\.|\./);
          const error = rule.validate(values.getIn(attrPath));

          if (error) {
            setValueInPath(errors, attrPath, error);
          }
        }
      }
    }
  }
  return errors;
};

const setValueInPath = (obj: { [key: string]: any }, attrPaths: string[], value: string) => {
  for (let i = 0; i < attrPaths.length; i++) {
    const currentAttr = attrPaths[i];
    const nextAttr = attrPaths[i + 1];
    if (nextAttr) {
      if (!obj[currentAttr]) {
        obj[currentAttr] = nextAttr.match(/^\d+$/) ? [] : {};
      }

      obj = obj[currentAttr];
    } else {
      obj[currentAttr] = value;
    }
  }
};

export const requireSubStepNotCompleted = (state: RootState, ...subStepIndexes: number[]) => {
  const tutorialState = state.get("tutorial");

  const tutorial = tutorialState.get("tutorial");
  if (!tutorial) return false;

  const currentStep = tutorial.steps[tutorialState.get("currentStepIndex")];
  if (!currentStep) return false;

  for (let i = 0; i < subStepIndexes.length; i++) {
    if (tutorialState.get("tutorialStepStatus").get(`${tutorialState.get("currentStepIndex")}-${subStepIndexes[i]}`)) {
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
  const tutorialState = state.get("tutorial");

  const tutorial = tutorialState.get("tutorial");
  if (!tutorial) return false;

  const currentStep = tutorial.steps[tutorialState.get("currentStepIndex")];
  if (!currentStep) return false;

  for (let i = 0; i < subStepIndexes.length; i++) {
    if (!tutorialState.get("tutorialStepStatus").get(`${tutorialState.get("currentStepIndex")}-${subStepIndexes[i]}`)) {
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
  const selector = formValueSelector(form);
  return selector(rootState, field);
};

export const isFormFieldValueEqualTo = (rootState: RootState, form: string, field: string, value: any) => {
  return getFormValue(rootState, form, field) === value;
};

export const isFormFieldMeet = (rootState: RootState, form: string, field: string, cb: (value: any) => boolean) => {
  const value = getFormValue(rootState, form, field);
  return !!value && cb(value);
};

export const isApplicationFormFieldValueEqualTo = (rootState: RootState, field: string, value: string) => {
  return isFormFieldValueEqualTo(rootState, "application", field, value);
};

export const isComponentFormFieldValueEqualTo = (rootState: RootState, field: string, value: string) => {
  return isFormFieldValueEqualTo(rootState, "componentLike", field, value);
};

export const isUnderPath = (state: RootState, ...paths: string[]) => {
  const pathname = state.get("router").get("location").get("pathname") as string;

  return paths.includes(pathname);
};
