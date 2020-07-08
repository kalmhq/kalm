import React from "react";
import { storiesOf } from "@storybook/react";
import configureStore from "configureStore";
import { Store } from "redux";
import { Provider } from "react-redux";

import { createBrowserHistory } from "history";
import { ApplicationListPage } from "pages/Application/List";
import { ConnectedRouter } from "connected-react-router/immutable";
import { RootState } from "reducers";
import {
  ApplicationDetails,
  ApplicationComponentDetails,
  LOAD_APPLICATIONS_PENDING,
  LOAD_APPLICATIONS_FAILED,
  LOAD_APPLICATIONS_FULFILLED,
  LOAD_ALL_NAMESAPCES_COMPONETS,
} from "types/application";
import Immutable from "immutable";
import { LOGOUT, LOAD_LOGIN_STATUS_FULFILLED } from "types/common";
import { text, number, date } from "@storybook/addon-knobs";
import { getCPUSamples, getMemorySamples } from "./data/application";

const history = createBrowserHistory();
const store: Store<RootState, any> = configureStore(history);

// @ts-ignore
export const withProvider = (story) => (
  <Provider store={store}>
    <ConnectedRouter history={history}>{story()}</ConnectedRouter>
  </Provider>
);

const resetStore = () => {
  store.dispatch({ type: LOGOUT });
  store.dispatch({
    type: LOAD_LOGIN_STATUS_FULFILLED,
    payload: {
      loginStatus: Immutable.fromJS({
        authorized: true,
        isAdmin: true,
        entity: "system:serviceaccount:default:kalm-sample-user",
        csrf: "",
      }),
    },
  });
};

storiesOf("Screens/Applications", module)
  .addDecorator(withProvider)
  .add("Loading Applications", () => {
    resetStore();
    store.dispatch({ type: LOAD_APPLICATIONS_PENDING });
    // store.dispatch(loadApplicationsAction());
    // store.dispatch(loadServicesAction("applicationName"));
    // const testApplication = store.getState().get("applications").get("applications").get(0);
    // const testService = store.getState().get("services").get("services").get(0);
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

    const appName = text("applicationName", "kalm-bookinfo", "Application");
    const podCounter = number("pod counter", 5, undefined, "Application");
    const createTime = date("create Date", new Date("2020-06-11"), "Application");
    const oneApp: ApplicationDetails = createApplication(appName);
    const applications: Immutable.List<ApplicationDetails> = Immutable.List<ApplicationDetails>([oneApp]);

    const allComponents: Immutable.Map<
      string,
      Immutable.List<ApplicationComponentDetails>
    > = createApplicationComponent(appName, podCounter, createTime);
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

    const oneApp: ApplicationDetails = createApplication(oneAppName);
    const oneAppComponent = createApplicationComponent(oneAppName, onePodCounter, oneAppCreateTime);

    const twoApp: ApplicationDetails = createApplication(twoAppName);
    const twoAppComponent = createApplicationComponent(twoAppName, twoPodCounter, twoAppCreateTime);

    const threeApp: ApplicationDetails = createApplication(threeAppName);
    const threeAppComponent = createApplicationComponent(threeAppName, threePodCounter, threeAppCreateTime);

    const fourApp: ApplicationDetails = createApplication(fourAppName);
    let fourAppComponent = createApplicationComponent(fourAppName, fourPodCounter, fourAppCreateTime);

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

const createApplication = (name: string) => {
  return Immutable.fromJS({
    name: name,
    metrics: {
      cpu: getCPUSamples(4),
      memory: getMemorySamples(572149760),
    },
    roles: ["writer", "reader"],
    status: "Active",
  });
};

const createApplicationComponent = (name: string, podCount: number, createTS: number) => {
  const counterArray = new Array(podCount);
  const podArray = [];
  for (var i = 0; i < counterArray.length; i++) {
    podArray.push(createApplicationComponentDetails(createTS));
  }
  const components: Immutable.List<ApplicationComponentDetails> = Immutable.fromJS(podArray);
  let componentsMap: Immutable.Map<string, Immutable.List<ApplicationComponentDetails>> = Immutable.Map({});
  componentsMap = componentsMap.set(name, components);
  return componentsMap;
};
const createApplicationComponentDetails = (createTS: number) => {
  let appComponent = Immutable.fromJS({
    env: [{ name: "LOG_DIR", value: "/tmp/logs" }],
    image: "docker.io/istio/examples-bookinfo-reviews-v3:1.15.0",
    nodeSelectorLabels: { "kubernetes.io/os": "linux" },
    preferNotCoLocated: true,
    ports: [{ name: "http", containerPort: 9080, servicePort: 9080 }],
    volumes: [
      { path: "/tmp", size: "32Mi", type: "emptyDir" },
      { path: "/opt/ibm/wlp/output", size: "32Mi", type: "emptyDir" },
    ],
    name: "reviews-v3",
    metrics: { cpu: null, memory: null },
    services: [
      {
        name: "reviews-v3",
        clusterIP: "10.104.32.91",
        ports: [{ name: "http", protocol: "TCP", port: 9080, targetPort: 9080 }],
      },
    ],
    pods: [
      {
        name: "reviews-v3-5c5fc9c7b8-gjtjs",
        node: "minikube",
        status: "Running",
        phase: "Running",
        statusText: "Running",
        restarts: 0,
        isTerminating: false,
        podIps: null,
        hostIp: "192.168.64.3",
        createTimestamp: createTS,
        startTimestamp: 1592592679000,
        containers: [
          { name: "reviews-v3", restartCount: 0, ready: true, started: false, startedAt: 0 },
          { name: "istio-proxy", restartCount: 0, ready: true, started: false, startedAt: 0 },
        ],
        metrics: {
          cpu: getCPUSamples(3),
          memory: getMemorySamples(101941248),
        },
        warnings: [],
      },
    ],
  });
  return appComponent;
};
