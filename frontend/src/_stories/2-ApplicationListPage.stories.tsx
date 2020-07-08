import React from "react";
import Immutable from "immutable";
import { storiesOf } from "@storybook/react";

import { ApplicationListPage } from "pages/Application/List";

import {
  ApplicationComponentDetails,
  ApplicationDetails,
  LOAD_ALL_NAMESAPCES_COMPONETS,
  LOAD_APPLICATIONS_FAILED,
  LOAD_APPLICATIONS_FULFILLED,
  LOAD_APPLICATIONS_PENDING,
} from "types/application";

import { date, number, text } from "@storybook/addon-knobs";
import { createApplicationComponent, createApplication, mergeMetrics, createRountes } from "./data/application";
import { LOAD_ROUTES_PENDING, LOAD_ROUTES_FULFILLED, HttpRoute } from "types/route";
import { store, withProvider, resetStore } from "./redux";

const createRoutes = (appNames: string[]) => {
  let routes = Immutable.List<HttpRoute>();
  appNames.map((appName, index) => {
    const namespace = `Application${index + 1}`;
    routes = routes.merge(createRountes(appName, namespace));
  });

  store.dispatch({ type: LOAD_ROUTES_PENDING });

  store.dispatch({
    type: LOAD_ROUTES_FULFILLED,
    payload: {
      httpRoutes: routes,
      namespace: "",
    },
  });
};

storiesOf("Screens/Applications", module)
  .addDecorator(withProvider)
  .add("Loading Applications", () => {
    resetStore();
    store.dispatch({ type: LOAD_APPLICATIONS_PENDING });
    return <ApplicationListPage />;
  })
  .add("Load Application Failed", () => {
    resetStore();
    store.dispatch({ type: LOAD_APPLICATIONS_PENDING });
    store.dispatch({ type: LOAD_APPLICATIONS_FAILED });
    return <ApplicationListPage />;
  })
  .add("Load Empty Application", () => {
    resetStore();
    const applications: Immutable.List<ApplicationDetails> = Immutable.List<ApplicationDetails>([]);
    store.dispatch({ type: LOAD_APPLICATIONS_PENDING });
    store.dispatch({ type: LOAD_APPLICATIONS_FULFILLED, payload: { applicationList: applications } });
    return <ApplicationListPage />;
  })
  .add("Load One Application", () => {
    resetStore();

    const appName = text("applicationName", "kalm-bookinfo", "Application1");
    const podCounter = number("pod counter", 5, undefined, "Application1");
    const createTime = date("create Date", new Date("2020-06-11"), "Application1");

    createRoutes([appName]);

    let oneApp: ApplicationDetails = createApplication(appName);

    const allComponents: Immutable.Map<
      string,
      Immutable.List<ApplicationComponentDetails>
    > = createApplicationComponent(appName, podCounter, createTime);

    oneApp = mergeMetrics(oneApp, allComponents);

    const applications: Immutable.List<ApplicationDetails> = Immutable.List<ApplicationDetails>([oneApp]);
    store.dispatch({ type: LOAD_APPLICATIONS_PENDING });
    store.dispatch({
      type: LOAD_ALL_NAMESAPCES_COMPONETS,
      payload: {
        components: allComponents,
      },
    });
    store.dispatch({ type: LOAD_APPLICATIONS_FULFILLED, payload: { applicationList: applications } });
    return <ApplicationListPage />;
  })
  .add("Load Four Applications", () => {
    resetStore();

    const oneAppName = text("application1Name", "kalm-bookinfo1", "Application1");
    const twoAppName = text("application1Name", "kalm-bookinfo2", "Application2");
    const threeAppName = text("application1Name", "kalm-bookinfo3", "Application3");
    const fourAppName = text("application1Name", "kalm-bookinfo4", "Application4");

    const oneAppCreateTime = date("create Date", new Date("2020-06-17"), "Application1");
    const twoAppCreateTime = date("create Date", new Date("2020-06-18"), "Application2");
    const threeAppCreateTime = date("create Date", new Date("2020-06-19"), "Application3");
    const fourAppCreateTime = date("create Date", new Date("2020-06-11"), "Application4");

    const onePodCounter = number("pod counter", 2, undefined, "Application1");
    const twoPodCounter = number("pod counter", 3, undefined, "Application2");
    const threePodCounter = number("pod counter", 4, undefined, "Application3");
    const fourPodCounter = number("pod counter", 5, undefined, "Application4");

    createRoutes([oneAppName, twoAppName, threeAppName, fourAppName]);

    let oneApp: ApplicationDetails = createApplication(oneAppName);
    const oneAppComponent = createApplicationComponent(oneAppName, onePodCounter, oneAppCreateTime);
    oneApp = mergeMetrics(oneApp, oneAppComponent);

    let twoApp: ApplicationDetails = createApplication(twoAppName);
    const twoAppComponent = createApplicationComponent(twoAppName, twoPodCounter, twoAppCreateTime);
    twoApp = mergeMetrics(twoApp, twoAppComponent);

    let threeApp: ApplicationDetails = createApplication(threeAppName);
    const threeAppComponent = createApplicationComponent(threeAppName, threePodCounter, threeAppCreateTime);
    threeApp = mergeMetrics(threeApp, threeAppComponent);

    let fourApp: ApplicationDetails = createApplication(fourAppName);
    let fourAppComponent = createApplicationComponent(fourAppName, fourPodCounter, fourAppCreateTime);
    fourApp = mergeMetrics(fourApp, fourAppComponent);

    fourAppComponent = fourAppComponent.merge(oneAppComponent, twoAppComponent, threeAppComponent);
    store.dispatch({
      type: LOAD_ALL_NAMESAPCES_COMPONETS,
      payload: {
        components: fourAppComponent,
      },
    });

    const applications: Immutable.List<ApplicationDetails> = Immutable.List<ApplicationDetails>([
      oneApp,
      twoApp,
      threeApp,
      fourApp,
    ]);

    // store.dispatch(loadApplicationsAction());
    store.dispatch({ type: LOAD_APPLICATIONS_PENDING });
    store.dispatch({ type: LOAD_APPLICATIONS_FULFILLED, payload: { applicationList: applications } });
    return <ApplicationListPage />;
  });
