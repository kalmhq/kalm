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
  const routesPath = "/routes";
  const newRoutePath = "/routes/new";

  const clusterInfo = state.get("cluster").get("info");
  const clusterIngressIP = clusterInfo.get("ingressIP") || "10.0.0.1"; // TODO

  const domain = clusterIngressIP.replace(/\./g, "-") + ".nip.io";

  const path = "/echoserver";
  let finialLink = "http://" + domain + path;

  if (clusterInfo.get("httpPort") !== 80) {
    finialLink = finialLink + ":" + clusterInfo.get("httpPort");
  }

  return {
    title,
    steps: [
      {
        name: "Go to routes page",
        description:
          "Route is a rule that describes how to introduce external traffic into the cluster. Let's find out how to navigate to routes page.",
        highlights: [
          {
            title: popupTitle,
            description: "Go to routes page",
            anchor: `[href="/routes"]`,
            triggeredByState: (state: RootState) => requireSubStepNotCompleted(state, 0),
          },
          {
            title: popupTitle,
            description: "Go to add route page",
            anchor: "[tutorial-anchor-id=add-route]",
            triggeredByState: (state: RootState) =>
              requireSubStepCompleted(state, 0) && requireSubStepNotCompleted(state, 1),
          },
        ],
        subSteps: [
          {
            title: <span>Go to routes page</span>,
            irrevocable: true,
            shouldCompleteByState: (state: RootState) => isUnderPath(state, routesPath, newRoutePath),
          },
          {
            title: "Go to add route page",
            irrevocable: true,
            shouldCompleteByState: (state: RootState) => isUnderPath(state, newRoutePath),
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
                Use <strong>/echoserver</strong> as path prefixes
              </span>
            ),
            formValidator: [
              {
                form: "route",
                field: "paths",
                validate: (paths) =>
                  paths.size === 1 && paths.get(0) === path ? undefined : `Please keep only one path "${path}"`,
              },
            ],
            shouldCompleteByState: (state: RootState) => isFormFieldValueEqualTo(state, "route", "paths[0]", path),
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
                    (destination) => destination.get("host") === "echoserver.tutorial.svc.cluster.local:8001",
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
                    (destination) => destination.get("host") === "echoserver.tutorial.svc.cluster.local:8001",
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
