import produce, { createDraft } from "immer";
import { Actions } from "types";
import {
  CLOSE_TUTORIAL_DRAWER,
  OPEN_TUTORIAL_DRAWER,
  RESET_TUTORIAL_ACTION,
  SET_TUTORIAL_ACTION,
  SET_TUTORIAL_FORM_VALUES,
  SET_TUTORIAL_HIGHLIGHT_STATUS,
  SET_TUTORIAL_STEP_COMPLETION_STATUS,
  Tutorial,
} from "types/tutorial";

export type State = {
  drawerOpen: boolean;
  tutorial?: Tutorial;
  tutorialStepStatus: { [key: string]: boolean };
  latestHighlight?: string;
  currentStepIndex: number;
  formValues?: { [key: string]: any };
};

const initialState: State = {
  drawerOpen: false,
  tutorial: undefined,
  tutorialStepStatus: {},
  currentStepIndex: -1,
};

const tryMoveToNextStep = (state: State): State => {
  const currentStepIndex = state.currentStepIndex;
  const currentStep = state.tutorial!.steps[currentStepIndex];

  if (currentStep.subSteps.length === 0) {
    return state;
  }

  const notCompletedSubSteps = currentStep.subSteps.filter((_subStep, subStepIndex) => {
    const statusKey = `${currentStepIndex}-${subStepIndex}`;
    return !state.tutorialStepStatus[statusKey];
  });

  if (notCompletedSubSteps.length > 0) {
    return state;
  }

  state.currentStepIndex = currentStepIndex + 1;
  return state;
};

const reducer = produce((state: State, action: Actions) => {
  if (action.type === OPEN_TUTORIAL_DRAWER) {
    state.drawerOpen = true;
    return;
  }

  if (action.type === CLOSE_TUTORIAL_DRAWER) {
    state.drawerOpen = false;
    return;
  }

  if (action.type === RESET_TUTORIAL_ACTION) {
    const drawerOpen = state.drawerOpen;
    state = createDraft(initialState);
    state.drawerOpen = drawerOpen;
    return state;
  }

  if (action.type === SET_TUTORIAL_ACTION) {
    const drawerOpen = state.drawerOpen;
    state = createDraft(initialState);
    state.drawerOpen = drawerOpen;
    state.tutorial = action.payload.tutorial;
    state.currentStepIndex = 0;
    return state;
  }

  if (action.type === SET_TUTORIAL_FORM_VALUES) {
    if (state.formValues) {
      state.formValues[action.payload.form] = action.payload.values;
    } else {
      state.formValues = {
        [action.payload.form]: action.payload.values,
      };
    }
    return;
  }

  const tutorial = state.tutorial;

  if (!tutorial) {
    return;
  }

  const currentStep = tutorial.steps[state.currentStepIndex];

  if (!currentStep) {
    return;
  }

  if (action.type === SET_TUTORIAL_STEP_COMPLETION_STATUS) {
    const statusKey = `${action.payload.stepIndex}-${action.payload.subStepIndex}`;
    if (state.tutorialStepStatus) {
      state.tutorialStepStatus[statusKey] = action.payload.isCompleted;
    } else {
      state.tutorialStepStatus = {
        [statusKey]: action.payload.isCompleted,
      };
    }
    state = tryMoveToNextStep(state);
    return;
  }

  if (action.type === SET_TUTORIAL_HIGHLIGHT_STATUS) {
    state.latestHighlight = `${action.payload.stepIndex}-${action.payload.highlightIndex}`;
    return;
  }

  currentStep.subSteps.forEach((subStep, subStepIndex) => {
    const statusKey = `${state.currentStepIndex}-${subStepIndex}`;
    if (
      !state.tutorialStepStatus[statusKey] && // this step not completed
      subStep.shouldCompleteByAction && // has action completion hook
      subStep.shouldCompleteByAction(action)
    ) {
      if (state.tutorialStepStatus) {
        state.tutorialStepStatus[statusKey] = true;
      } else {
        state.tutorialStepStatus = {
          [statusKey]: true,
        };
      }
    }
  });

  state = tryMoveToNextStep(state);
  return;
}, initialState);

export default reducer;
