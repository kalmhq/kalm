import { date, number, text } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";
import { ApplicationListPage } from "pages/Application/List";
import React from "react";
import {
  ApplicationComponentDetails,
  ApplicationDetails,
  LOAD_ALL_NAMESAPCES_COMPONETS,
  LOAD_APPLICATIONS_FAILED,
  LOAD_APPLICATIONS_FULFILLED,
  LOAD_APPLICATIONS_PENDING,
} from "types/application";
import {
  createApplication,
  createApplicationComponent,
  createRoutes,
  generateRandomIntList,
  mergeMetrics,
} from "../data/application";
import { resetStore, store, withProvider } from "../ReduxConfig";

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
    const applications: ApplicationDetails[] = [];
    store.dispatch({ type: LOAD_APPLICATIONS_PENDING });
    store.dispatch({ type: LOAD_APPLICATIONS_FULFILLED, payload: { applicationList: applications } });
    return <ApplicationListPage />;
  })
  .add("Load One Application", () => {
    resetStore();

    const appName = text("applicationName", "kalm-bookinfo", "Application1");
    const componentCounter = number("pod counter", 5, undefined, "Application1");
    const podCounter = number("pod counter", 5, undefined, "Application1");
    const createTime = date("create Date", new Date("2020-06-11"), "Application1");

    createRoutes(store, [appName]);

    let oneApp: ApplicationDetails = createApplication(appName) as any;

    const allComponents: { [key: string]: ApplicationComponentDetails[] } = createApplicationComponent(
      appName,
      componentCounter,
      createTime,
      generateRandomIntList(podCounter, 0, 5),
    );

    oneApp = mergeMetrics(oneApp, allComponents);

    const applications: ApplicationDetails[] = [oneApp];
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

    const oneComponentCounter = number("pod counter", 2, undefined, "Application1");
    const twoComponentCounter = number("pod counter", 3, undefined, "Application2");
    const threeComponentCounter = number("pod counter", 4, undefined, "Application3");
    const fourComponentCounter = number("pod counter", 5, undefined, "Application4");

    const onePodCounter = number("pod counter", 2, undefined, "Application1");
    const twoPodCounter = number("pod counter", 3, undefined, "Application2");
    const threePodCounter = number("pod counter", 4, undefined, "Application3");
    const fourPodCounter = number("pod counter", 5, undefined, "Application4");

    createRoutes(store, [oneAppName, twoAppName, threeAppName, fourAppName]);

    let oneApp: ApplicationDetails = createApplication(oneAppName) as any;
    const oneAppComponent = createApplicationComponent(
      oneAppName,
      oneComponentCounter,
      oneAppCreateTime,
      generateRandomIntList(onePodCounter, 0, 5),
    );
    oneApp = mergeMetrics(oneApp, oneAppComponent);

    let twoApp: ApplicationDetails = createApplication(twoAppName) as any;
    const twoAppComponent = createApplicationComponent(
      twoAppName,
      twoComponentCounter,
      twoAppCreateTime,
      generateRandomIntList(twoPodCounter, 0, 5),
    );
    twoApp = mergeMetrics(twoApp, twoAppComponent);

    let threeApp: ApplicationDetails = createApplication(threeAppName) as any;
    const threeAppComponent = createApplicationComponent(
      threeAppName,
      threeComponentCounter,
      threeAppCreateTime,
      generateRandomIntList(threePodCounter, 0, 5),
    );
    threeApp = mergeMetrics(threeApp, threeAppComponent);

    let fourApp: ApplicationDetails = createApplication(fourAppName) as any;
    let fourAppComponent = createApplicationComponent(
      fourAppName,
      fourComponentCounter,
      fourAppCreateTime,
      generateRandomIntList(fourPodCounter, 0, 5),
    );
    fourApp = mergeMetrics(fourApp, fourAppComponent);

    fourAppComponent = Object.assign(oneAppComponent, twoAppComponent, threeAppComponent, fourAppComponent);
    store.dispatch({
      type: LOAD_ALL_NAMESAPCES_COMPONETS,
      payload: {
        components: fourAppComponent,
      },
    });

    const applications: ApplicationDetails[] = [oneApp, twoApp, threeApp, fourApp];

    // store.dispatch(loadApplicationsAction());
    store.dispatch({ type: LOAD_APPLICATIONS_PENDING });
    store.dispatch({ type: LOAD_APPLICATIONS_FULFILLED, payload: { applicationList: applications } });
    return <ApplicationListPage />;
  });
