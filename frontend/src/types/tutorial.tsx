import { Actions } from "types";
import React from "react";
import Immutable from "immutable";
import { LOCATION_CHANGE } from "connected-react-router";
import { actionTypes, ActionTypes } from "redux-form";
import { formValueSelector } from "redux-form/immutable";
import { RootState } from "reducers";
import { State as TutorialState } from "../reducers/tutorial";
import { ComponentLikePort } from "./componentTemplate";

export const OPEN_TUTORIAL_DRAWER = "OPEN_TUTORIAL_DRAWER";
export const CLOSE_TUTORIAL_DRAWER = "CLOSE_TUTORIAL_DRAWER";

export const SET_TUTORIAL_ACTION = "SET_TUTORIAL_ACTION";
export const START_TUTORIAL_ACTION = "START_TUTORIAL_ACTION";
export const RESET_TUTORIAL_ACTION = "RESET_TUTORIAL_ACTION";

export const SET_TUTORIAL_STEP_COMPLETION_STATUS = "SET_TUTORIAL_STEP_COMPLETION_STATUS";

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
  exitWhenPathnameChangeAndNotCompleted?: boolean;
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

export interface StartTutorialAction {
  type: typeof START_TUTORIAL_ACTION;
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
  | StartTutorialAction
  | TutorialDrawerAction
  | ResetTutorialAction;

const isChangeReduxFormFieldTo = (action: Actions, form: string, field: string, value: string) => {
  return (
    action.type === (actionTypes.CHANGE as keyof ActionTypes) &&
    !!action.meta &&
    action.meta.form === form &&
    action.meta.field === field &&
    action.payload === value
  );
};

const isChangeApplicationFromFieldTo = (action: Actions, field: string, value: string) => {
  return isChangeReduxFormFieldTo(action, "application", field, value);
};

const isChangeComponentFromFieldTo = (action: Actions, field: string, value: string) => {
  return isChangeReduxFormFieldTo(action, "componentLike", field, value);
};

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
  const pathname = state
    .get("router")
    .get("location")
    .get("pathname") as string;

  return paths.includes(pathname);
};

const pathnameHasPerfix = (state: RootState, prefix: string) => {
  const pathname = state
    .get("router")
    .get("location")
    .get("pathname") as string;

  return pathname.startsWith(prefix);
};

const visitedPathname = (action: Actions, pathname: string) =>
  action.type === LOCATION_CHANGE && action.payload.location.pathname === pathname && action.payload.action === "PUSH";

export const formValidatorNotBlockByTutorial = (
  values: Immutable.Map<string, any>,
  props: { tutorialState: TutorialState; form: string },
) => {
  // { tutorialState: TutorialState; form: string }
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

export const CreateApplicationTutorialFactory = (applicationName: string): Tutorial => ({
  id: "Deploy an Application",
  steps: [
    {
      name: "Create an application",
      description:
        "Application is a virtual group of other resources or configurations. It help to organize different deployment environment. For example, production, staging, testing environments can be treated as three applications.",
      highlights: [],
      subSteps: [
        {
          title: "Go to applications page",
          // highlight: {
          //   title: "Click Here",
          //   description: "Go to applications page",
          //   requirePathnamePrefix: "/",
          //   anchor: "[tutorial-anchor-id=first-level-sidebar-item-applications]",
          //   position: "right",
          // },
          // shouldCompleteByState: (state: RootState) => pathnameHasPerfix(state, "/applications"),
          shouldCompleteByAction: (action: Actions) => visitedPathname(action, "/applications"),
        },
        {
          title: (
            <span>
              Click the <strong>Add</strong> button
            </span>
          ),
          // highlight: {
          //   title: "Click Here",
          //   description: "Go to new application page",
          //   requirePathname: "/applications",
          //   anchor: "[tutorial-anchor-id=add-application]",
          // },
          shouldCompleteByAction: (action: Actions) => visitedPathname(action, "/applications/new"),
        },
        {
          title: (
            <span>
              Type <strong>{applicationName}</strong> in name field
            </span>
          ),
          // highlight: {
          //   title: "Fill field",
          //   description: `type <strong>${applicationName}</strong> in name field.`,
          //   requirePathname: "/applications/new",
          //   anchor: "[tutorial-anchor-id=application-form-name-field]",
          // },
          formValidator: [
            {
              form: "application",
              field: "name",
              validate: name =>
                name === applicationName ? undefined : `Please follow the tutorial, use ${applicationName}.`,
            },
          ],
          shouldCompleteByState: (state: RootState) =>
            isApplicationFormFieldValueEqualTo(state, "name", applicationName),
        },
        {
          title: "Submit form",
          // highlight: {
          //   title: "Complete the form",
          //   description: "Create an application",
          //   requirePathname: "/applications/new",
          //   anchor: "[tutorial-anchor-id=application-form-submit-button]",
          // },
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
      highlights: [],
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
              validate: value => (value === "echoserver" ? undefined : `Please use "echoserver"`),
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
          // highlight: {
          //   title: "Fill form",
          //   description:
          //     'Test with "k8s.gcr.io/echoserver:1.10" image, which is simple http server handles any http request, returns request and pod details as response.',
          //   requirePathname: `/applications/${applicationName}/edit`,
          //   anchor: "[tutorial-anchor-id=component-from-basic]",
          //   position: "right",
          // },
          formValidator: [
            {
              form: "componentLike",
              field: "image",
              validate: value =>
                value === "k8s.gcr.io/echoserver:1.10" ? undefined : `Please use "k8s.gcr.io/echoserver:1.10"`,
            },
          ],
          shouldCompleteByState: (state: RootState) =>
            isComponentFormFieldValueEqualTo(state, "image", "k8s.gcr.io/echoserver:1.10"),
        },
        {
          title: (
            <span>
              Add an exposed port in advanced <strong>networking tab</strong>
            </span>
          ),
          // highlight: {
          //   title: "Fill form",
          //   description:
          //     'Test with "k8s.gcr.io/echoserver:1.10" image, which is simple http server handles any http request, returns request and pod details as response.',
          //   requirePathname: `/applications/${applicationName}/edit`,
          //   anchor: "[tutorial-anchor-id=component-from-basic]",
          //   position: "right",
          // },
          // formValidator: [
          //   {
          //     form: "componentLike",
          //     field: "image",
          //     validate: value =>
          //       value === "k8s.gcr.io/echoserver:1.10" ? undefined : `Please use "k8s.gcr.io/echoserver:1.10"`,
          //   },
          // ],
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
              validate: value => (value === "http" ? undefined : `Please use "http"`),
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
              validate: value => (value === 80 ? undefined : `Please use "80"`),
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
              validate: value => (value === 80 || !value ? undefined : `Please use "80"`),
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
              .find(x => x.get("name") === applicationName);

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
