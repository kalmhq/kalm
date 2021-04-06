import { setTutorialAction } from "actions/tutorial";
import { APPLICATION_FORM_ID, COMPONENT_FORM_ID } from "forms/formIDs";
import React from "react";
import { RootState, store } from "store";
import { AccessYourApplicationTutorialFactory } from "tutorials/accessYourApplication";
import {
  getFormValue,
  isApplicationFormFieldValueEqualTo,
  isComponentFormFieldValueEqualTo,
  isUnderPath,
  popupTitle,
  requireSubStepCompleted,
  requireSubStepNotCompleted,
} from "tutorials/utils";
import { Actions } from "types";
import { CREATE_APPLICATION, CREATE_COMPONENT } from "types/application";
import { ComponentLikePort } from "types/componentTemplate";
import { Tutorial, TutorialFactory } from "types/tutorial";

export const BasicApplicationCreationTutorialFactory: TutorialFactory = (title): Tutorial => {
  let apps = store.getState().applications.applications;

  const applicationNameTemplate = "tutorial-";
  let i = 0;
  let applicationName = "tutorial";

  // eslint-disable-next-line
  while (apps.find((app) => app.name === applicationName)) {
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
            title: popupTitle,
            description: "Go to applications page",
            anchor: "[tutorial-anchor-id=first-level-sidebar-item-apps]",
            triggeredByState: (state: RootState) => requireSubStepNotCompleted(state, 0),
          },
          {
            title: popupTitle,
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
                  name === applicationName || name === `${applicationName}`
                    ? undefined
                    : `Please follow the tutorial, use ${applicationName}.`,
              },
            ],
            shouldCompleteByState: (state: RootState) =>
              isApplicationFormFieldValueEqualTo(state, "name", applicationName) ||
              isApplicationFormFieldValueEqualTo(state, "name", `${applicationName}`),
          },
          {
            title: "Submit form",
            shouldCompleteByAction: (action: Actions) => action.type === CREATE_APPLICATION,
          },
        ],
      },
      {
        name: "Add a component",
        description:
          "Component describes how a program is running, includes start, scheduling, update and termination. Also, you can configure disks, health checker and resources limit for it.",
        highlights: [
          {
            title: popupTitle,
            description: "Go to add component page",
            anchor: "[tutorial-anchor-id=add-component-button]",
            triggeredByState: (state: RootState) => requireSubStepNotCompleted(state, 0),
          },
          {
            title: popupTitle,
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
                Use <strong>kalmhq/echoserver</strong> image
              </span>
            ),
            formValidator: [
              {
                form: COMPONENT_FORM_ID,
                field: "image",
                validate: (value) => (value === "kalmhq/echoserver" ? undefined : `Please use "kalmhq/echoserver"`),
              },
            ],
            shouldCompleteByState: (state: RootState) =>
              isComponentFormFieldValueEqualTo(state, "image", "kalmhq/echoserver"),
          },
          {
            title: (
              <span>
                Add an port in advanced <strong>networking tab</strong>
              </span>
            ),
            shouldCompleteByState: (state: RootState) => {
              const ports = getFormValue(state, COMPONENT_FORM_ID, "ports");
              return ports && ports.length > 0;
            },
          },
          {
            title: (
              <span>
                Set the port protocol to <strong>http</strong>
              </span>
            ),
            formValidator: [
              {
                form: COMPONENT_FORM_ID,
                field: "ports.0.protocol",
                validate: (value) => (value === "http" ? undefined : `Please use "http"`),
              },
            ],
            shouldCompleteByState: (state: RootState) => {
              const ports = getFormValue(state, COMPONENT_FORM_ID, "ports") as ComponentLikePort[] | undefined;
              return !!ports && ports.length > 0 && ports[0]!.protocol === "http";
            },
          },
          {
            title: (
              <span>
                Set <strong>container port</strong> to <strong>8001</strong>
              </span>
            ),
            formValidator: [
              {
                form: COMPONENT_FORM_ID,
                field: "ports.0.containerPort",
                validate: (value) => (value === 8001 ? undefined : `Please use "8001"`),
              },
            ],
            shouldCompleteByState: (state: RootState) => {
              const ports = getFormValue(state, COMPONENT_FORM_ID, "ports") as ComponentLikePort[] | undefined;
              return !!ports && ports.length > 0 && Number(ports[0]!.containerPort) === 8001;
            },
          },
          {
            title: (
              <span>
                Set <strong>service port</strong> to <strong>8001</strong> or leave it blank
              </span>
            ),
            formValidator: [
              {
                form: COMPONENT_FORM_ID,
                field: "ports.0.servicePort",
                validate: (value) => (value === 8001 || !value ? undefined : `Please use "8001"`),
              },
            ],
            shouldCompleteByState: (state: RootState) => {
              const ports = getFormValue(state, COMPONENT_FORM_ID, "ports") as ComponentLikePort[] | undefined;
              return !!ports && ports.length > 0 && (ports[0]!.servicePort === 8001 || !ports[0]!.servicePort);
            },
          },
          {
            title: "Deploy!",
            shouldCompleteByAction: (action: Actions) => {
              return action.type === CREATE_COMPONENT;
            },
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
              const components = state.components.components[applicationName];

              if (!components || components.length === 0) {
                return false;
              }

              const pod = components[0]?.pods[0];

              if (!pod) {
                return false;
              }

              return pod.phase === "Running" && pod.status === "Running";
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
