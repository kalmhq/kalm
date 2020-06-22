import { RootState } from "../reducers";
import { Actions } from "../types";
import { ActionTypes, actionTypes } from "redux-form";
import Immutable from "immutable";
import { ComponentLikePort } from "../types/componentTemplate";
import React from "react";
import { Tutorial } from "../types/tutorial";
import { formValueSelector } from "redux-form/immutable";

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

export const BasicApplicationCreationTutorialFactory = (applicationName: string): Tutorial => ({
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
