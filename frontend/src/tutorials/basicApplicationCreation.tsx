import { RootState } from "reducers";
import { Actions } from "types";
import { ActionTypes, actionTypes } from "redux-form";
import Immutable from "immutable";
import { ComponentLikePort } from "types/componentTemplate";
import React from "react";
import { Tutorial, TutorialFactory } from "types/tutorial";
import { ApplicationDetails } from "types/application";
import { store } from "store";
import {
  getFormValue,
  isApplicationFormFieldValueEqualTo,
  isComponentFormFieldValueEqualTo,
  isUnderPath,
  requireSubStepCompleted,
  requireSubStepNotCompleted,
} from "tutorials/utils";
import { APPLICATION_FORM_ID, COMPONENT_FORM_ID } from "forms/formIDs";
import { AccessYourApplicationTutorialFactory } from "tutorials/accessYourApplication";
import { setTutorialAction } from "actions/tutorial";

export const BasicApplicationCreationTutorialFactory: TutorialFactory = (title): Tutorial => {
  let apps: Immutable.List<ApplicationDetails> = store.getState().get("applications").get("applications");

  const applicationNameTemplate = "tutorial-";
  let i = 0;
  let applicationName = "tutorial";

  // eslint-disable-next-line
  while (apps.find((app) => app.get("name") === applicationName)) {
    i += 1;
    applicationName = applicationNameTemplate + i;
  }

  return {
    title,
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
                form: APPLICATION_FORM_ID,
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
              action.meta!.form === APPLICATION_FORM_ID,
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
            description: "Go to add component page",
            anchor: "[tutorial-anchor-id=add-component-button]",
            triggeredByState: (state: RootState) => requireSubStepNotCompleted(state, 0),
          },
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
                form: COMPONENT_FORM_ID,
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
                form: COMPONENT_FORM_ID,
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
              const ports = getFormValue(state, COMPONENT_FORM_ID, "ports");
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
                form: COMPONENT_FORM_ID,
                field: "ports[0].name",
                validate: (value) => (value === "http" ? undefined : `Please use "http"`),
              },
            ],
            shouldCompleteByState: (state: RootState) => {
              const ports = getFormValue(state, COMPONENT_FORM_ID, "ports") as
                | Immutable.List<ComponentLikePort>
                | undefined;
              return !!ports && ports.size > 0 && ports.get(0)!.get("name") === "http";
            },
          },
          {
            title: (
              <span>
                Set <strong>container port</strong> to <strong>8080</strong>
              </span>
            ),
            formValidator: [
              {
                form: COMPONENT_FORM_ID,
                field: "ports[0].containerPort",
                validate: (value) => (value === 8080 ? undefined : `Please use "8080"`),
              },
            ],
            shouldCompleteByState: (state: RootState) => {
              const ports = getFormValue(state, COMPONENT_FORM_ID, "ports") as
                | Immutable.List<ComponentLikePort>
                | undefined;
              return !!ports && ports.size > 0 && ports.get(0)!.get("containerPort") === 8080;
            },
          },
          {
            title: (
              <span>
                Set <strong>service port</strong> to <strong>8080</strong> or leave it blank
              </span>
            ),
            formValidator: [
              {
                form: COMPONENT_FORM_ID,
                field: "ports[0].servicePort",
                validate: (value) => (value === 8080 || !value ? undefined : `Please use "8080"`),
              },
            ],
            shouldCompleteByState: (state: RootState) => {
              const ports = getFormValue(state, COMPONENT_FORM_ID, "ports") as
                | Immutable.List<ComponentLikePort>
                | undefined;
              return (
                !!ports &&
                ports.size > 0 &&
                (ports.get(0)!.get("servicePort") === 8080 || !ports.get(0)!.get("servicePort"))
              );
            },
          },
          {
            title: "Deploy!",
            shouldCompleteByAction: (action: Actions) =>
              action.type === (actionTypes.SET_SUBMIT_SUCCEEDED as keyof ActionTypes) &&
              action.meta!.form === COMPONENT_FORM_ID,
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
              const components = state.get("components").get("components").get(applicationName);

              if (!components) {
                return false;
              }

              const pod = components.getIn([0, "pods", 0]);

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
      onClick: () => {
        store.dispatch(
          setTutorialAction(AccessYourApplicationTutorialFactory(`Access ${applicationName} application`)),
        );
      },
    },
  };
};
