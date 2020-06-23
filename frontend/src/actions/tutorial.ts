import {
  CLOSE_TUTORIAL_DRAWER,
  OPEN_TUTORIAL_DRAWER,
  RESET_TUTORIAL_ACTION,
  ResetTutorialAction,
  SET_TUTORIAL_ACTION,
  SET_TUTORIAL_HIGHLIGHT_STATUS,
  SET_TUTORIAL_STEP_COMPLETION_STATUS,
  SetTutorialAction,
  SetTutorialHighlightStatusAction,
  SetTutorialStepCompletionStatusAction,
  Tutorial,
  TutorialDrawerAction,
} from "types/tutorial";

export const setTutorialAction = (id: string, tutorial: Tutorial): SetTutorialAction => {
  return {
    type: SET_TUTORIAL_ACTION,
    payload: {
      id,
      tutorial,
    },
  };
};

export const resetTutorialAction = (): ResetTutorialAction => {
  return {
    type: RESET_TUTORIAL_ACTION,
  };
};

export const openTutorialDrawerAction = (): TutorialDrawerAction => {
  return {
    type: OPEN_TUTORIAL_DRAWER,
  };
};

export const closeTutorialDrawerAction = (): TutorialDrawerAction => {
  return {
    type: CLOSE_TUTORIAL_DRAWER,
  };
};

export const setTutorialHighlightStatusAction = (
  stepIndex: number,
  highlightIndex: number,
): SetTutorialHighlightStatusAction => {
  return {
    type: SET_TUTORIAL_HIGHLIGHT_STATUS,
    payload: {
      stepIndex,
      highlightIndex,
    },
  };
};

export const setTutorialStepCompletionStatus = (
  stepIndex: number,
  subStepIndex: number,
  isCompleted: boolean,
): SetTutorialStepCompletionStatusAction => {
  return {
    type: SET_TUTORIAL_STEP_COMPLETION_STATUS,
    payload: {
      isCompleted,
      stepIndex,
      subStepIndex,
    },
  };
};
