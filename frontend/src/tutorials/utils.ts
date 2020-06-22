import Immutable from "immutable";
import { State as TutorialState } from "../reducers/tutorial";

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
