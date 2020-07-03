import Immutable from "immutable";
import {
  CLOSE_TUTORIAL_DRAWER,
  OPEN_TUTORIAL_DRAWER,
  RESET_TUTORIAL_ACTION,
  SET_TUTORIAL_ACTION,
  SET_TUTORIAL_HIGHLIGHT_STATUS,
  SET_TUTORIAL_STEP_COMPLETION_STATUS,
  Tutorial,
} from "types/tutorial";
import { Actions } from "types";
import { ImmutableMap } from "typings";

export type State = ImmutableMap<{
  drawerOpen: boolean;
  tutorial?: Tutorial;
  tutorialStepStatus: Immutable.Map<string, boolean>;
  latestHighlight?: string;
  currentStepIndex: number;
}>;

const DISABLE_TUTORIAL_AUTO_OPEN = "DISABLE_TUTORIAL_AUTO_OPEN";

const initialState: State = Immutable.Map({
  drawerOpen: !window.localStorage.getItem(DISABLE_TUTORIAL_AUTO_OPEN),
  tutorial: null,
  tutorialStepStatus: Immutable.Map(),
  currentStepIndex: -1,
});

const tryMoveToNextStep = (state: State): State => {
  const currentStepIndex = state.get("currentStepIndex");
  const currentStep = state.get("tutorial")!.steps[currentStepIndex];

  if (currentStep.subSteps.length === 0) {
    return state;
  }

  const notCompletedSubSteps = currentStep.subSteps.filter((_subStep, subStepIndex) => {
    const statusKey = `${currentStepIndex}-${subStepIndex}`;
    return !state.get("tutorialStepStatus").get(statusKey);
  });

  return notCompletedSubSteps.length > 0 ? state : state.set("currentStepIndex", currentStepIndex + 1);
};

const reducer = (state: State = initialState, action: Actions): State => {
  if (action.type === OPEN_TUTORIAL_DRAWER) {
    return state.set("drawerOpen", true);
  }

  if (action.type === CLOSE_TUTORIAL_DRAWER) {
    window.localStorage.setItem(DISABLE_TUTORIAL_AUTO_OPEN, "true");
    return state.set("drawerOpen", false);
  }

  if (action.type === RESET_TUTORIAL_ACTION) {
    return initialState.set("drawerOpen", state.get("drawerOpen"));
  }

  if (action.type === SET_TUTORIAL_ACTION) {
    return initialState
      .set("drawerOpen", state.get("drawerOpen"))
      .set("tutorial", action.payload.tutorial)
      .set("currentStepIndex", 0);
  }

  const tutorial = state.get("tutorial");

  if (!tutorial) {
    return state;
  }

  const currentStep = tutorial.steps[state.get("currentStepIndex")];

  if (!currentStep) {
    return state;
  }

  if (action.type === SET_TUTORIAL_STEP_COMPLETION_STATUS) {
    state = state.setIn(
      ["tutorialStepStatus", `${action.payload.stepIndex}-${action.payload.subStepIndex}`],
      action.payload.isCompleted,
    );

    return tryMoveToNextStep(state);
  }

  if (action.type === SET_TUTORIAL_HIGHLIGHT_STATUS) {
    state = state.set("latestHighlight", `${action.payload.stepIndex}-${action.payload.highlightIndex}`);
    return state;
  }

  currentStep.subSteps.forEach((subStep, subStepIndex) => {
    const statusKey = `${state.get("currentStepIndex")}-${subStepIndex}`;
    if (
      !state.get("tutorialStepStatus").get(statusKey) && // this step not completed
      subStep.shouldCompleteByAction && // has action completion hook
      subStep.shouldCompleteByAction(action)
    ) {
      state = state.setIn(["tutorialStepStatus", statusKey], true);
    }
  });

  state = tryMoveToNextStep(state);

  return state;
};

export default reducer;
