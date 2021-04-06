import { resetTutorialAction } from "actions/tutorial";
import { store } from "configureStore";
import { ROUTE_FORM_ID } from "forms/formIDs";
import React from "react";
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
import { CREATE_COMPONENT } from "types/application";
import { HttpRouteDestination } from "types/route";
import { Tutorial, TutorialFactory } from "types/tutorial";
import { KMLink } from "widgets/Link";

const resetTutorial = () => {
  store.dispatch(resetTutorialAction());
};

export const AccessYourApplicationTutorialFactory: TutorialFactory = (title): Tutorial => {
  const state = store.getState();
  const apps = state.applications.applications;
  const application = apps.find((x) => x.name === "tutorial");

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

  const applicationName = application.name;
  const routesPath = "/routes";
  const newRoutePath = "/routes/new";

  const clusterInfo = state.cluster.info;
  const clusterIngressIP = clusterInfo.ingressIP || "10.0.0.1"; // TODO

  const domain = clusterIngressIP.replace(/\./g, "-") + ".nip.io";

  const path = "/echoserver";
  let finialLink = "http://" + domain + path;

  if (clusterInfo.httpPort !== 80) {
    finialLink = finialLink + ":" + clusterInfo.httpPort;
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
                validate: (hosts) => (hosts.length === 1 && hosts[0] === domain ? undefined : `Please use ${domain}`),
              },
            ],
            shouldCompleteByState: (state: RootState) =>
              isFormFieldValueEqualTo(state, ROUTE_FORM_ID, "hosts", [domain]),
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
                  paths.length === 1 && paths[0] === path ? undefined : `Please keep only one path "${path}"`,
              },
            ],
            shouldCompleteByState: (state: RootState) => isFormFieldValueEqualTo(state, ROUTE_FORM_ID, "paths", [path]),
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
                validate: (hosts: string[]) => (hosts.includes("GET") ? undefined : `Please allow GET method`),
              },
            ],
            shouldCompleteByState: (state: RootState) =>
              isFormFieldMeet(state, ROUTE_FORM_ID, "methods", (schemes: string[]) => schemes.includes("GET")),
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
                validate: (hosts: string[]) => (hosts.includes("http") ? undefined : `Please allow http scheme`),
              },
            ],
            shouldCompleteByState: (state: RootState) =>
              isFormFieldMeet(state, "route", "schemes", (schemes: string[]) => schemes.includes("http")),
          },
          {
            title: <span>Add echoserver in tutorial application as the only target</span>,
            formValidator: [
              {
                form: "route",
                field: "destinations",
                validate: (destinations: HttpRouteDestination[]) =>
                  destinations.length === 1 &&
                  destinations.find(
                    (destination) =>
                      destination.host === "echoserver.tutorial.svc.cluster.local:8001" ||
                      destination.host === `echoserver.tutorial.svc.cluster.local:8001`,
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
                (destinations: HttpRouteDestination[]) =>
                  destinations.length === 1 &&
                  !!destinations.find(
                    (destination) =>
                      destination.host === "echoserver.tutorial.svc.cluster.local:8001" ||
                      destination.host === `echoserver.tutorial.svc.cluster.local:8001`,
                  ),
              ),
          },
          {
            title: "Submit form",
            shouldCompleteByAction: (action: Actions) => action.type === CREATE_COMPONENT,
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
