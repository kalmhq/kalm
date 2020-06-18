import Immutable from "immutable";
import {
  CLOSE_TUTORIAL_DRAWER,
  OPEN_TUTORIAL_DRAWER,
  RESET_TUTORIAL_ACTION,
  SET_TUTORIAL_ACTION,
  SET_TUTORIAL_STEP_COMPLETION_STATUS,
  START_TUTORIAL_ACTION,
  Tutorial,
} from "types/tutorial";
import { Actions } from "../types";
import { ImmutableMap } from "../typings";

export type State = ImmutableMap<{
  drawerOpen: boolean;
  tutorialID: string;
  tutorial?: Tutorial;
  tutorialStepStatus: Immutable.Map<string, boolean>;
  currentStepIndex: number;
}>;

const initialState: State = Immutable.Map({
  drawerOpen: false,
  tutorialID: "",
  tutorial: null,
  tutorialStepStatus: Immutable.Map(),
  currentStepIndex: -1,
});

const tryMoveToNextStep = (state: State): State => {
  const currentStepIndex = state.get("currentStepIndex");
  const currentStep = state.get("tutorial")!.steps[currentStepIndex];

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
    return state.set("drawerOpen", false);
  }

  if (action.type === RESET_TUTORIAL_ACTION) {
    return initialState.set("drawerOpen", state.get("drawerOpen"));
  }

  if (action.type === SET_TUTORIAL_ACTION) {
    return state
      .set("tutorialID", action.payload.id)
      .set("tutorial", action.payload.tutorial)
      .set("currentStepIndex", 0);
  }

  if (!state.get("tutorialID")) {
    return state;
  }

  if (action.type === START_TUTORIAL_ACTION) {
    return state.set("currentStepIndex", 0);
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
