import Immutable from "immutable";
import React from "react";
import { RootState } from "reducers";
import { actionTypes, ActionTypes } from "redux-form";
import { formValueSelector } from "redux-form/immutable";
import { Actions } from "types";
import { State as TutorialState } from "../reducers/tutorial";
import { ComponentLikePort } from "./componentTemplate";

export const OPEN_TUTORIAL_DRAWER = "OPEN_TUTORIAL_DRAWER";
export const CLOSE_TUTORIAL_DRAWER = "CLOSE_TUTORIAL_DRAWER";

export const SET_TUTORIAL_ACTION = "SET_TUTORIAL_ACTION";
export const RESET_TUTORIAL_ACTION = "RESET_TUTORIAL_ACTION";

export const SET_TUTORIAL_STEP_COMPLETION_STATUS = "SET_TUTORIAL_STEP_COMPLETION_STATUS";
export const SET_TUTORIAL_HIGHLIGHT_STATUS = "SET_TUTORIAL_HIGHLIGHT_STATUS";

export interface TutorialSubStep {
  title: React.ReactNode;
  highlight?: {
    title: string;
    description: string;
    requirePathnamePrefix?: string;
    requirePathname?: string;
    position?: string;
    anchor: string;
  };
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
  description: string;
  subSteps: TutorialSubStep[];
  highlights: TutorialHighlight[];
}

export interface Tutorial {
  id: string;
  steps: TutorialStep[];
  nextStep?: {
    text: string;
    onClick: () => void;
  };
}

export interface SetTutorialAction {
  type: typeof SET_TUTORIAL_ACTION;
  payload: {
    id: string;
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

export type TutorialActions =
  | SetTutorialAction
  | SetTutorialStepCompletionStatusAction
  | SetTutorialHighlightStatusAction
  | TutorialDrawerAction
  | ResetTutorialAction;

const getFormValue = (rootState: RootState, form: string, field: string) => {
  const selector = formValueSelector(form);
  return selector(rootState, field);
};

const isFormFieldValueEqualTo = (rootState: RootState, form: string, field: string, value: string) => {
  return getFormValue(rootState, form, field) === value;
};

const isApplicationFormFieldValueEqualTo = (rootState: RootState, field: string, value: string) => {
  return isFormFieldValueEqualTo(rootState, "application", field, value);
};

const isComponentFormFieldValueEqualTo = (rootState: RootState, field: string, value: string) => {
  return isFormFieldValueEqualTo(rootState, "componentLike", field, value);
};

const isUnderPath = (state: RootState, ...paths: string[]) => {
  const pathname = state.get("router").get("location").get("pathname") as string;

  return paths.includes(pathname);
};

export const formValidatOrNotBlockByTutorial = (
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

export const CreateApplicationTutorialFactory = (applicationName: string): Tutorial => ({
  id: "Deploy an Application",
  steps: [
    {
      name: "Create an application",
      description:
        "Application is a virtual group of other resources or configurations. It help to organize different deployment environment. For example, production, staging, testing environments can be treated as three applications.",
      highlights: [
        {
          title: "Chick Here",
          description: "Go to applications page",
          anchor: "[tutorial-anchor-id=first-level-sidebar-item-applications]",
          triggeredByState: (state: RootState) => requireSubStepNotCompleted(state, 0),
        },
        {
          title: "Chick Here",
          description: "Go to new application page",
          anchor: "[tutorial-anchor-id=add-application]",
          triggeredByState: (state: RootState) =>
            requireSubStepNotCompleted(state, 1) && requireSubStepCompleted(state, 0),
        },
      ],
      subSteps: [
        {
          title: "Go to applications page",
          irrevocable: true,
          shouldCompleteByState: (state: RootState) => isUnderPath(state, "/applications", "/applications/new"),
        },
        {
          title: (
            <span>
              Click the <strong>Add</strong> button
            </span>
          ),
          irrevocable: true,
          shouldCompleteByState: (state: RootState) => isUnderPath(state, "/applications/new"),
        },
        {
          title: (
            <span>
              Type <strong>{applicationName}</strong> in name field
            </span>
          ),
          formValidator: [
            {
              form: "application",
              field: "name",
              validate: (name) =>
                name === applicationName ? undefined : `Please follow the tutorial, use ${applicationName}.`,
            },
          ],
          shouldCompleteByState: (state: RootState) =>
            isApplicationFormFieldValueEqualTo(state, "name", applicationName),
        },
        {
          title: "Submit form",
          shouldCompleteByAction: (action: Actions) =>
            action.type === (actionTypes.SET_SUBMIT_SUCCEEDED as keyof ActionTypes) &&
            action.meta!.form === "application",
        },
      ],
    },
    {
      name: "Add a component",
      description:
        "Component describes how a program is running, includes start, scheduling, update and termination. Also, you can configure disks, health checker and resources limit for it.",
      highlights: [
        {
          title: "Chick Here",
          description: "Go to networking tab",
          anchor: "[tutorial-anchor-id=Networking]",
          triggeredByState: (state: RootState) =>
            requireSubStepNotCompleted(state, 2) && requireSubStepCompleted(state, 0, 1),
        },
      ],
      subSteps: [
        {
          title: (
            <span>
              Use <strong>echoserver</strong> as name
            </span>
          ),
          formValidator: [
            {
              form: "componentLike",
              field: "name",
              validate: (value) => (value === "echoserver" ? undefined : `Please use "echoserver"`),
            },
          ],
          shouldCompleteByState: (state: RootState) => isComponentFormFieldValueEqualTo(state, "name", "echoserver"),
        },
        {
          title: (
            <span>
              Use <strong>k8s.gcr.io/echoserver:1.10</strong> image
            </span>
          ),
          formValidator: [
            {
              form: "componentLike",
              field: "image",
              validate: (value) =>
                value === "k8s.gcr.io/echoserver:1.10" ? undefined : `Please use "k8s.gcr.io/echoserver:1.10"`,
            },
          ],
          shouldCompleteByState: (state: RootState) =>
            isComponentFormFieldValueEqualTo(state, "image", "k8s.gcr.io/echoserver:1.10"),
        },
        {
          title: (
            <span>
              Add an port in advanced <strong>networking tab</strong>
            </span>
          ),
          shouldCompleteByState: (state: RootState) => {
            const ports = getFormValue(state, "componentLike", "ports");
            return ports && ports.size > 0;
          },
        },
        {
          title: (
            <span>
              Name the port <strong>http</strong>
            </span>
          ),
          formValidator: [
            {
              form: "componentLike",
              field: "ports[0].name",
              validate: (value) => (value === "http" ? undefined : `Please use "http"`),
            },
          ],
          shouldCompleteByState: (state: RootState) => {
            const ports = getFormValue(state, "componentLike", "ports") as
              | Immutable.List<ComponentLikePort>
              | undefined;
            return !!ports && ports.size > 0 && ports.get(0)!.get("name") === "http";
          },
        },
        {
          title: (
            <span>
              Set <strong>publish port</strong> to <strong>80</strong>
            </span>
          ),
          formValidator: [
            {
              form: "componentLike",
              field: "ports[0].containerPort",
              validate: (value) => (value === 80 ? undefined : `Please use "80"`),
            },
          ],
          shouldCompleteByState: (state: RootState) => {
            const ports = getFormValue(state, "componentLike", "ports") as
              | Immutable.List<ComponentLikePort>
              | undefined;
            return !!ports && ports.size > 0 && ports.get(0)!.get("containerPort") === 80;
          },
        },
        {
          title: (
            <span>
              Set <strong>listening on port</strong> to <strong>80</strong> or leave it blank
            </span>
          ),
          formValidator: [
            {
              form: "componentLike",
              field: "ports[0].servicePort",
              validate: (value) => (value === 80 || !value ? undefined : `Please use "80"`),
            },
          ],
          shouldCompleteByState: (state: RootState) => {
            const ports = getFormValue(state, "componentLike", "ports") as
              | Immutable.List<ComponentLikePort>
              | undefined;
            return (
              !!ports &&
              ports.size > 0 &&
              (ports.get(0)!.get("servicePort") === 80 || !ports.get(0)!.get("servicePort"))
            );
          },
        },
        {
          title: "Deploy!",
          shouldCompleteByAction: (action: Actions) =>
            action.type === (actionTypes.SET_SUBMIT_SUCCEEDED as keyof ActionTypes) &&
            action.meta!.form === "componentLike",
        },
      ],
    },
    {
      name: "Vailidate Status",
      description: "Take a look at the component status panel. It shows that your deployment is in progress.",
      subSteps: [
        {
          title: "Wait the component to be running.",
          shouldCompleteByState: (state: RootState) => {
            const application = state
              .get("applications")
              .get("applications")
              .find((x) => x.get("name") === applicationName);

            if (!application) {
              return false;
            }

            const pod = application.getIn(["components", 0, "pods", 0]);

            if (!pod) {
              return false;
            }

            return pod.get("phase") === "Running" && pod.get("status") === "Running";
          },
        },
      ],
      highlights: [],
    },
  ],
  nextStep: {
    text: "Add external access for your application.",
    onClick: () => {},
  },
});
