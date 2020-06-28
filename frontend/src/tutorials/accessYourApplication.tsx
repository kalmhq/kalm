import Immutable from "immutable";
import React from "react";
import { Tutorial, TutorialFactory } from "types/tutorial";
import { ApplicationDetails } from "types/application";
import { store } from "store";
import { Link } from "@material-ui/core";
import { resetTutorialAction } from "actions/tutorial";
import { RootState } from "reducers";
import {
  isFormFieldMeet,
  isFormFieldValueEqualTo,
  isUnderPath,
  requireSubStepCompleted,
  requireSubStepNotCompleted,
} from "tutorials/utils";
import { Actions } from "types";
import { ActionTypes, actionTypes } from "redux-form";
import { HttpRouteDestination } from "types/route";

const resetTutorial = () => {
  store.dispatch(resetTutorialAction());
};

export const AccessYourApplicationTutorialFactory: TutorialFactory = (title): Tutorial => {
  const state = store.getState();

  const apps: Immutable.List<ApplicationDetails> = state.get("applications").get("applications");
  const application = apps.find((x) => x.get("name") === "hello-world");

  if (!application) {
    return {
      title,
      steps: [
        {
          name: "You need an application first.",
          description: (
            <span>
              Please{" "}
              <Link component="button" onClick={resetTutorial}>
                go back
              </Link>{" "}
              and follow the <strong>Deploy an application</strong> tutorial to create an application. It's required for
              this one.
            </span>
          ),
          error: true,
          subSteps: [],
          highlights: [],
        },
      ],
    };
  }

  const applicationName = application.get("name");
  const applicationsPath = "/applications";
  const applicationDetailPath = "/applications/" + applicationName;
  const applicationRoutesPath = "/applications/" + applicationName + "/routes";
  const applicationNewRoutePath = "/applications/" + applicationName + "/routes/new";

  const clusterInfo = state.get("cluster").get("info");
  const clusterIngressIP = clusterInfo.get("ingressIP") || "10.0.0.1"; // TODO

  const domain = clusterIngressIP.replace(/\./g, "-") + ".nip.io";

  return {
    title,
    steps: [
      {
        name: "Go to routes page",
        description:
          "Route is a rule that describes how to introduce external traffic into the cluster. Route is a sub-resource under an application. Let's find out how to navigate to routes page.",
        highlights: [
          {
            title: "Chick here",
            description: "Go to applications page",
            anchor: "[tutorial-anchor-id=first-level-sidebar-item-applications]",
            triggeredByState: (state: RootState) => requireSubStepNotCompleted(state, 0),
          },
          {
            title: "Chick the name",
            description: "Go to applications details page",
            anchor: `[tutorial-anchor-id=applications-list-item-${application.get("name")}]`,
            triggeredByState: (state: RootState) =>
              requireSubStepCompleted(state, 0) && requireSubStepNotCompleted(state, 1),
          },
          {
            title: "Chick here",
            description: "Go to routes page",
            anchor: `[href="/applications/${applicationName}/routes"]`,
            triggeredByState: (state: RootState) =>
              requireSubStepCompleted(state, 0, 1) && requireSubStepNotCompleted(state, 2),
          },
          {
            title: "Chick here",
            description: "Go to add route page",
            anchor: "[tutorial-anchor-id=add-route]",
            triggeredByState: (state: RootState) =>
              requireSubStepCompleted(state, 0, 1, 2) && requireSubStepNotCompleted(state, 3),
          },
        ],
        subSteps: [
          {
            title: "Go to applications page",
            irrevocable: true,
            shouldCompleteByState: (state: RootState) =>
              isUnderPath(
                state,
                applicationsPath,
                applicationDetailPath,
                applicationRoutesPath,
                applicationNewRoutePath,
              ),
          },
          {
            title: (
              <span>
                View <strong>{application.get("name")}</strong> details page
              </span>
            ),
            irrevocable: true,
            shouldCompleteByState: (state: RootState) =>
              isUnderPath(state, applicationDetailPath, applicationRoutesPath, applicationNewRoutePath),
          },
          {
            title: <span>Go to routes page</span>,
            irrevocable: true,
            shouldCompleteByState: (state: RootState) =>
              isUnderPath(state, applicationRoutesPath, applicationNewRoutePath),
          },
          {
            title: "Go to add route page",
            irrevocable: true,
            shouldCompleteByState: (state: RootState) => isUnderPath(state, applicationNewRoutePath),
          },
        ],
      },
      {
        name: "Add a route",
        description: `Complete the form to add first route for ${applicationName} application`,
        subSteps: [
          {
            title: (
              <span>
                Use <strong>{domain}</strong> as hosts
              </span>
            ),
            formValidator: [
              {
                form: "route",
                field: "hosts",
                validate: (hosts) => (hosts.size === 1 && hosts.get(0) === domain ? undefined : `Please use ${domain}`),
              },
            ],
            shouldCompleteByState: (state: RootState) => isFormFieldValueEqualTo(state, "route", "hosts[0]", domain),
          },
          {
            title: (
              <span>
                Allow <strong>GET</strong> method
              </span>
            ),
            formValidator: [
              {
                form: "route",
                field: "methods",
                validate: (hosts: Immutable.List<string>) =>
                  hosts.includes("GET") ? undefined : `Please allow GET method`,
              },
            ],
            shouldCompleteByState: (state: RootState) =>
              isFormFieldMeet(state, "route", "methods", (schemes: Immutable.List<string>) => schemes.includes("GET")),
          },
          {
            title: (
              <span>
                Allow <strong>http</strong> scheme
              </span>
            ),
            formValidator: [
              {
                form: "route",
                field: "schemes",
                validate: (hosts: Immutable.List<string>) =>
                  hosts.includes("http") ? undefined : `Please allow http scheme`,
              },
            ],
            shouldCompleteByState: (state: RootState) =>
              isFormFieldMeet(state, "route", "schemes", (schemes: Immutable.List<string>) => schemes.includes("http")),
          },
          {
            title: <span>Add echoserver in hello-world application as the only target</span>,
            formValidator: [
              {
                form: "route",
                field: "destinations",
                validate: (destinations: Immutable.List<HttpRouteDestination>) =>
                  destinations.size === 1 &&
                  destinations.find(
                    (destination) => destination.get("host") === "echoserver.hello-world.svc.cluster.local:8080",
                  )
                    ? undefined
                    : `Please use echoserver as the only target`,
              },
            ],
            shouldCompleteByState: (state: RootState) =>
              isFormFieldMeet(
                state,
                "route",
                "destinations",
                (destinations: Immutable.List<HttpRouteDestination>) =>
                  destinations.size === 1 &&
                  !!destinations.find(
                    (destination) => destination.get("host") === "echoserver.hello-world.svc.cluster.local:8080",
                  ),
              ),
          },
          {
            title: "Submit form",
            shouldCompleteByAction: (action: Actions) =>
              action.type === (actionTypes.SET_SUBMIT_SUCCEEDED as keyof ActionTypes) && action.meta!.form === "route",
          },
        ],
        highlights: [],
      },
      {
        name: "Try your route",
        description: (
          <span>
            Try open{" "}
            <Link href={"http://" + domain} target="_blank" rel="noreferer">
              {domain}
            </Link>{" "}
            in your browser.
          </span>
        ),
        subSteps: [],
        highlights: [],
      },
    ],
  };

  // return {
  //   title,
  //   steps: [
  //     {
  //       name: "Create an application",
  //       description:
  //         "Application is a virtual group of other resources or configurations. It help to organize different deployment environment. For example, production, staging, testing environments can be treated as three applications.",
  //       highlights: [
  //         {
  //           title: "Chick Here",
  //           description: "Go to applications page",
  //           anchor: "[tutorial-anchor-id=first-level-sidebar-item-applications]",
  //           triggeredByState: (state: RootState) => requireSubStepNotCompleted(state, 0),
  //         },
  //         {
  //           title: "Chick Here",
  //           description: "Go to new application page",
  //           anchor: "[tutorial-anchor-id=add-application]",
  //           triggeredByState: (state: RootState) =>
  //             requireSubStepNotCompleted(state, 1) && requireSubStepCompleted(state, 0),
  //         },
  //       ],
  //       subSteps: [
  //         {
  //           title: "Go to applications page",
  //           irrevocable: true,
  //           shouldCompleteByState: (state: RootState) => isUnderPath(state, "/applications", "/applications/new"),
  //         },
  //         {
  //           title: (
  //             <span>
  //               Click the <strong>Add</strong> button
  //             </span>
  //           ),
  //           irrevocable: true,
  //           shouldCompleteByState: (state: RootState) => isUnderPath(state, "/applications/new"),
  //         },
  //         {
  //           title: (
  //             <span>
  //               Type <strong>{applicationName}</strong> in name field
  //             </span>
  //           ),
  //           formValidator: [
  //             {
  //               form: APPLICATION_FORM_ID,
  //               field: "name",
  //               validate: (name) =>
  //                 name === applicationName ? undefined : `Please follow the tutorial, use ${applicationName}.`,
  //             },
  //           ],
  //           shouldCompleteByState: (state: RootState) =>
  //             isApplicationFormFieldValueEqualTo(state, "name", applicationName),
  //         },
  //         {
  //           title: "Submit form",
  //           shouldCompleteByAction: (action: Actions) =>
  //             action.type === (actionTypes.SET_SUBMIT_SUCCEEDED as keyof ActionTypes) &&
  //             action.meta!.form === APPLICATION_FORM_ID,
  //         },
  //       ],
  //     },
  //     {
  //       name: "Add a component",
  //       description:
  //         "Component describes how a program is running, includes start, scheduling, update and termination. Also, you can configure disks, health checker and resources limit for it.",
  //       highlights: [
  //         {
  //           title: "Chick Here",
  //           description: "Go to networking tab",
  //           anchor: "[tutorial-anchor-id=Networking]",
  //           triggeredByState: (state: RootState) =>
  //             requireSubStepNotCompleted(state, 2) && requireSubStepCompleted(state, 0, 1),
  //         },
  //       ],
  //       subSteps: [
  //         {
  //           title: (
  //             <span>
  //               Use <strong>echoserver</strong> as name
  //             </span>
  //           ),
  //           formValidator: [
  //             {
  //               form: COMPONENT_FORM_ID,
  //               field: "name",
  //               validate: (value) => (value === "echoserver" ? undefined : `Please use "echoserver"`),
  //             },
  //           ],
  //           shouldCompleteByState: (state: RootState) => isComponentFormFieldValueEqualTo(state, "name", "echoserver"),
  //         },
  //         {
  //           title: (
  //             <span>
  //               Use <strong>k8s.gcr.io/echoserver:1.10</strong> image
  //             </span>
  //           ),
  //           formValidator: [
  //             {
  //               form: COMPONENT_FORM_ID,
  //               field: "image",
  //               validate: (value) =>
  //                 value === "k8s.gcr.io/echoserver:1.10" ? undefined : `Please use "k8s.gcr.io/echoserver:1.10"`,
  //             },
  //           ],
  //           shouldCompleteByState: (state: RootState) =>
  //             isComponentFormFieldValueEqualTo(state, "image", "k8s.gcr.io/echoserver:1.10"),
  //         },
  //         {
  //           title: (
  //             <span>
  //               Add an port in advanced <strong>networking tab</strong>
  //             </span>
  //           ),
  //           shouldCompleteByState: (state: RootState) => {
  //             const ports = getFormValue(state, COMPONENT_FORM_ID, "ports");
  //             return ports && ports.size > 0;
  //           },
  //         },
  //         {
  //           title: (
  //             <span>
  //               Name the port <strong>http</strong>
  //             </span>
  //           ),
  //           formValidator: [
  //             {
  //               form: COMPONENT_FORM_ID,
  //               field: "ports[0].name",
  //               validate: (value) => (value === "http" ? undefined : `Please use "http"`),
  //             },
  //           ],
  //           shouldCompleteByState: (state: RootState) => {
  //             const ports = getFormValue(state, COMPONENT_FORM_ID, "ports") as
  //               | Immutable.List<ComponentLikePort>
  //               | undefined;
  //             return !!ports && ports.size > 0 && ports.get(0)!.get("name") === "http";
  //           },
  //         },
  //         {
  //           title: (
  //             <span>
  //               Set <strong>publish port</strong> to <strong>80</strong>
  //             </span>
  //           ),
  //           formValidator: [
  //             {
  //               form: COMPONENT_FORM_ID,
  //               field: "ports[0].containerPort",
  //               validate: (value) => (value === 80 ? undefined : `Please use "80"`),
  //             },
  //           ],
  //           shouldCompleteByState: (state: RootState) => {
  //             const ports = getFormValue(state, COMPONENT_FORM_ID, "ports") as
  //               | Immutable.List<ComponentLikePort>
  //               | undefined;
  //             return !!ports && ports.size > 0 && ports.get(0)!.get("containerPort") === 80;
  //           },
  //         },
  //         {
  //           title: (
  //             <span>
  //               Set <strong>listening on port</strong> to <strong>80</strong> or leave it blank
  //             </span>
  //           ),
  //           formValidator: [
  //             {
  //               form: COMPONENT_FORM_ID,
  //               field: "ports[0].servicePort",
  //               validate: (value) => (value === 80 || !value ? undefined : `Please use "80"`),
  //             },
  //           ],
  //           shouldCompleteByState: (state: RootState) => {
  //             const ports = getFormValue(state, COMPONENT_FORM_ID, "ports") as
  //               | Immutable.List<ComponentLikePort>
  //               | undefined;
  //             return (
  //               !!ports &&
  //               ports.size > 0 &&
  //               (ports.get(0)!.get("servicePort") === 80 || !ports.get(0)!.get("servicePort"))
  //             );
  //           },
  //         },
  //         {
  //           title: "Deploy!",
  //           shouldCompleteByAction: (action: Actions) =>
  //             action.type === (actionTypes.SET_SUBMIT_SUCCEEDED as keyof ActionTypes) &&
  //             action.meta!.form === COMPONENT_FORM_ID,
  //         },
  //       ],
  //     },
  //     {
  //       name: "Vailidate Status",
  //       description: "Take a look at the component status panel. It shows that your deployment is in progress.",
  //       subSteps: [
  //         {
  //           title: "Wait the component to be running.",
  //           shouldCompleteByState: (state: RootState) => {
  //             const application = state
  //               .get("applications")
  //               .get("applications")
  //               .find((x) => x.get("name") === applicationName);
  //
  //             if (!application) {
  //               return false;
  //             }
  //
  //             const pod = application.getIn(["components", 0, "pods", 0]);
  //
  //             if (!pod) {
  //               return false;
  //             }
  //
  //             return pod.get("phase") === "Running" && pod.get("status") === "Running";
  //           },
  //         },
  //       ],
  //       highlights: [],
  //     },
  //   ],
  //   nextStep: {
  //     text: "Add external access for your application.",
  //     onClick: () => {},
  //   },
  // };
};
