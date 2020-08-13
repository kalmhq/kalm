import Immutable from "immutable";
import React from "react";
import { Tutorial, TutorialFactory } from "types/tutorial";
import { ApplicationDetails } from "types/application";
import { store } from "store";
import { resetTutorialAction } from "actions/tutorial";
import { RootState } from "reducers";
import {
  isFormFieldMeet,
  isFormFieldValueEqualTo,
  isUnderPath,
  popupTitle,
  requireSubStepCompleted,
  requireSubStepNotCompleted,
} from "tutorials/utils";
import { Actions } from "types";
import { ActionTypes, actionTypes } from "redux-form";
import { HttpRouteDestination } from "types/route";
import { KMLink } from "widgets/Link";

const resetTutorial = () => {
  store.dispatch(resetTutorialAction());
};

export const AccessYourApplicationTutorialFactory: TutorialFactory = (title): Tutorial => {
  const state = store.getState();

  const apps: Immutable.List<ApplicationDetails> = state.get("applications").get("applications");
  const application = apps.find((x) => x.get("name") === "tutorial");

  if (!application) {
    return {
      title,
      steps: [
        {
          name: "You need an application first.",
          description: (
            <span>
              Please{" "}
              <KMLink component="button" onClick={resetTutorial}>
                go back
              </KMLink>{" "}
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
  const applicationDetailPath = "/applications/" + applicationName + "/components";
  const applicationRoutesPath = "/applications/" + applicationName + "/routes";
  const applicationNewRoutePath = "/routes/new";

  const clusterInfo = state.get("cluster").get("info");
  const clusterIngressIP = clusterInfo.get("ingressIP") || "10.0.0.1"; // TODO

  const domain = clusterIngressIP.replace(/\./g, "-") + ".nip.io";

  let finialLink = "http://" + domain;

  if (clusterInfo.get("httpPort") !== 80) {
    finialLink = finialLink + ":" + clusterInfo.get("httpPort");
  }

  return {
    title,
    steps: [
      {
        name: "Go to routes page",
        description:
          "Route is a rule that describes how to introduce external traffic into the cluster. Route is a sub-resource under an application. Let's find out how to navigate to routes page.",
        highlights: [
          {
            title: popupTitle,
            description: "Go to applications page",
            anchor: "[tutorial-anchor-id=first-level-sidebar-item-applications]",
            triggeredByState: (state: RootState) => requireSubStepNotCompleted(state, 0),
          },
          {
            title: "Click the Name",
            description: "Go to applications details page",
            anchor: `[tutorial-anchor-id=applications-list-item-${application.get("name")}]`,
            triggeredByState: (state: RootState) =>
              requireSubStepCompleted(state, 0) && requireSubStepNotCompleted(state, 1),
          },
          {
            title: popupTitle,
            description: "Go to routes page",
            anchor: `[href="/applications/${applicationName}/routes"]`,
            triggeredByState: (state: RootState) =>
              requireSubStepCompleted(state, 0, 1) && requireSubStepNotCompleted(state, 2),
          },
          {
            title: popupTitle,
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
            title: <span>Add echoserver in tutorial application as the only target</span>,
            formValidator: [
              {
                form: "route",
                field: "destinations",
                validate: (destinations: Immutable.List<HttpRouteDestination>) =>
                  destinations.size === 1 &&
                  destinations.find(
                    (destination) => destination.get("host") === "echoserver.tutorial.svc.cluster.local:8080",
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
                    (destination) => destination.get("host") === "echoserver.tutorial.svc.cluster.local:8080",
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
            <KMLink href={finialLink} target="_blank" rel="noreferrer">
              {finialLink}
            </KMLink>{" "}
            in your browser.
          </span>
        ),
        subSteps: [],
        highlights: [],
      },
    ],
  };
};
