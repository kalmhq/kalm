export const OPEN_TUTORIAL_DRAWER = "OPEN_TUTORIAL_DRAWER";
export const CLOSE_TUTORIAL_DRAWER = "CLOSE_TUTORIAL_DRAWER";

export const SET_TUTORIAL_ACTION = "SET_TUTORIAL_ACTION";
export const START_TUTORIAL_ACTION = "START_TUTORIAL_ACTION";
export const RESET_TUTORIAL_ACTION = "RESET_TUTORIAL_ACTION";

export interface TutorialAction {
  type: typeof SET_TUTORIAL_ACTION | typeof START_TUTORIAL_ACTION;
  payload: {
    id: string;
  };
}

export interface ResetTutorialAction {
  type: typeof RESET_TUTORIAL_ACTION;
}

export interface TutorialDrawerAction {
  type: typeof OPEN_TUTORIAL_DRAWER | typeof CLOSE_TUTORIAL_DRAWER;
}

export type TutorialActions = TutorialAction | TutorialDrawerAction | ResetTutorialAction;
