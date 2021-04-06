import { RootState } from "configureStore";
import React from "react";
import { Actions } from "types";

export const OPEN_TUTORIAL_DRAWER = "OPEN_TUTORIAL_DRAWER";
export const CLOSE_TUTORIAL_DRAWER = "CLOSE_TUTORIAL_DRAWER";

export const SET_TUTORIAL_ACTION = "SET_TUTORIAL_ACTION";
export const RESET_TUTORIAL_ACTION = "RESET_TUTORIAL_ACTION";

export const SET_TUTORIAL_STEP_COMPLETION_STATUS = "SET_TUTORIAL_STEP_COMPLETION_STATUS";
export const SET_TUTORIAL_HIGHLIGHT_STATUS = "SET_TUTORIAL_HIGHLIGHT_STATUS";

export const SET_TUTORIAL_FORM_VALUES = "SET_TUTORIAL_FORM_VALUES";

export type TutorialFactory = (title: string) => Tutorial;

interface TutorialConfigItem {
  name: string;
  factory: TutorialFactory;
}

export interface TutorialConfig {
  name: string;
  items: TutorialConfigItem[];
}

export interface TutorialSubStep {
  title: React.ReactNode;
  irrevocable?: boolean;
  formValidator?: { form: string; field: string; validate: (value: any) => string | undefined }[];

  shouldCompleteByAction?(action: Actions): boolean;

  shouldCompleteByState?(state: RootState): boolean;
}

export interface TutorialHighlight {
  title: string;
  description: string;
  anchor: string;

  position?: string;
  requirePathnamePrefix?: string;
  requirePathname?: string;

  triggeredByAction?(action: Actions): boolean;

  triggeredByState?(state: RootState): boolean;
}

export interface TutorialStep {
  name: string;
  description: React.ReactNode;
  error?: boolean;
  subSteps: TutorialSubStep[];
  highlights: TutorialHighlight[];
}

export interface Tutorial {
  title: string;
  steps: TutorialStep[];
  nextStep?: {
    text: string;
    onClick: () => void;
  };
}

export interface SetTutorialAction {
  type: typeof SET_TUTORIAL_ACTION;
  payload: {
    tutorial: Tutorial;
  };
}

export interface SetTutorialStepCompletionStatusAction {
  type: typeof SET_TUTORIAL_STEP_COMPLETION_STATUS;
  payload: {
    isCompleted: boolean;
    stepIndex: number;
    subStepIndex: number;
  };
}

export interface SetTutorialHighlightStatusAction {
  type: typeof SET_TUTORIAL_HIGHLIGHT_STATUS;
  payload: {
    stepIndex: number;
    highlightIndex: number;
  };
}

export interface ResetTutorialAction {
  type: typeof RESET_TUTORIAL_ACTION;
}

export interface TutorialDrawerAction {
  type: typeof OPEN_TUTORIAL_DRAWER | typeof CLOSE_TUTORIAL_DRAWER;
}

export interface SetTutorialFormValuesAction {
  type: typeof SET_TUTORIAL_FORM_VALUES;
  payload: {
    form: string;
    values: any;
  };
}

export type TutorialActions =
  | SetTutorialAction
  | SetTutorialStepCompletionStatusAction
  | SetTutorialHighlightStatusAction
  | TutorialDrawerAction
  | ResetTutorialAction
  | SetTutorialFormValuesAction;
