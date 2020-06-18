import {
  SetTutorialAction,
  StartTutorialAction,
  SET_TUTORIAL_ACTION,
  START_TUTORIAL_ACTION,
  RESET_TUTORIAL_ACTION,
  ResetTutorialAction,
  OPEN_TUTORIAL_DRAWER,
  TutorialDrawerAction,
  CLOSE_TUTORIAL_DRAWER,
  Tutorial,
  SET_TUTORIAL_STEP_COMPLETION_STATUS,
  SetTutorialStepCompletionStatusAction,
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

export const startTutorialAction = (): StartTutorialAction => {
  return {
    type: START_TUTORIAL_ACTION,
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
