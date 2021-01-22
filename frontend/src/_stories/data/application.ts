import { array, object, optionsKnob } from "@storybook/addon-knobs";
import { OptionsKnobOptions } from "@storybook/addon-knobs/dist/components/types";
import { ApplicationComponentDetails, ApplicationDetails, PodStatus } from "types/application";
import { MetricItem, MetricList } from "types/common";
import { HttpRoute, LOAD_ROUTES_FULFILLED, LOAD_ROUTES_PENDING } from "types/route";

export const createRoute = (name: string, namespace: string): HttpRoute[] => {
  const label = "Methods";
  const valuesObj = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    DELETE: "DELETE",
    OPTIONS: "OPTIONS",
    HEAD: "HEAD",
    TRACE: "TRACE",
    CONNECT: "CONNECT",
  };
  const defaultValue = ["GET"];
  const optionsObj: OptionsKnobOptions = {
    display: "check",
  };
  const groupId = namespace;

  const methods = optionsKnob(label, valuesObj, defaultValue, optionsObj, groupId);

  const hosts = array("Hosts", ["bookinfo.demo.com"], ",", namespace);
  const schemes = optionsKnob(
    "Schemes",
    { http: "http", https: "https" },
    ["http"],
    {
      display: "check",
    },
    namespace,
  );

  const paths = array("Paths", ["/"], ",", namespace);

  const destinationOptions = [
    { host: "productV1page", weight: 1 },
    { host: "productV2page", weight: 1 },
    { host: "productV3page", weight: 1 },
  ];
  // @ts-ignore
  const destinations = object("Destinations", [destinationOptions[0]], groupId);
  return [
    {
      hosts: hosts,
      paths: paths, //["/"],
      methods: methods as any, //["GET", "POST"],
      schemes: schemes as any, //["http"],
      stripPath: true,
      destinations: destinations,
      destinationsStatus: [],
      name: "bookinfo",
    },
  ];
};

export const createRoutes = (store: any, appNames: string[]) => {
  let routes: HttpRoute[] = [];
  appNames.forEach((appName, index) => {
    const namespace = `Application${index + 1}`;
    routes = routes.concat(createRoute(appName, namespace));
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

export const createApplication = (name: string) => {
  return {
    name: name,
    metrics: {
      cpu: getCPUSamples(4),
      memory: getMemorySamples(172149760),
    },
    roles: ["writer", "reader"],
    status: "Active",
  };
};

export const createApplicationComponent = (
  name: string,
  componentCount: number,
  createTS: number,
  podCounters: number[],
) => {
  const componentArray = [];
  for (var i = 0; i < componentCount; i++) {
    componentArray.push(createApplicationComponentDetails(i, createTS, podCounters[i]));
  }
  let componentsMap: { [key: string]: ApplicationComponentDetails[] } = {};
  componentsMap[name] = componentArray as any[];
  return componentsMap;
};

export const createApplicationComponentDetails = (index: number, createTS: number, pod: number) => {
  const pods = [];
  for (let index = 0; index < pod; index++) {
    pods.push(createPodDetails(createTS));
  }
  const appComponent = {
    env: [{ name: "LOG_DIR", value: "/tmp/logs" }],
    image: "docker.io/istio/examples-bookinfo-reviews-v3:1.15.0",
    nodeSelectorLabels: { "kubernetes.io/os": "linux" },
    preferNotCoLocated: true,
    ports: [
      { name: "http", containerPort: 9080, servicePort: 9080 },
      { name: "http2", protocol: "TCP", port: 8080, servicePort: 8080 },
    ],
    volumes: [
      { path: "/tmp", size: "32Mi", type: "emptyDir" },
      { path: "/opt/ibm/wlp/output", size: "32Mi", type: "emptyDir" },
    ],
    name: `reviews-v3-${index}`,
    metrics: { cpu: null, memory: null },
    services: [
      {
        name: `reviews-v3-${index}`,
        clusterIP: "10.104.32.91",
        ports: [{ name: "http", protocol: "TCP", port: 9080, targetPort: 9080 }],
      },
    ],
    pods: pods,
  };
  return appComponent;
};

const createPodDetails = (createTS: number) => {
  return {
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
  };
};
interface ICreateMetricsSegmentType {
  from?: Date;
  counter?: number;
  value?: number;
  thresholds?: number;
}

const createMetricsSegements = ({
  from = new Date(),
  counter = 180,
  value = 3,
  thresholds = 3,
}: ICreateMetricsSegmentType) => {
  let cpuSegments: MetricItem[] = [];
  const fromTS = from.getTime();
  const validateRange = [value - thresholds > 0 ? value - thresholds : 0, value + thresholds];

  for (let index = 0; index < counter; index++) {
    let lastValue = validateRange[0];
    let value = Math.floor(Math.random() * validateRange[1]) + validateRange[0];
    if (index > 0) {
      lastValue = cpuSegments[index - 1]?.y as number;
      const seed = Math.floor(Math.random() * 3) + 1;
      const direction = seed >= 2 ? 1 : -1;
      value = lastValue + (direction * thresholds * 1) / 4;
      value = Math.max(validateRange[0], Math.min(value, validateRange[1]));
    }

    const element: MetricItem = { x: fromTS + 500 * index, y: value };
    cpuSegments.push(element);
  }
  return cpuSegments;
};

export const getCPUSamples = (value: any) => {
  let samples = createMetricsSegements({ value: value });
  return samples;
};

export const getMemorySamples = (value: any) => {
  let samples = createMetricsSegements({ value: value, thresholds: 10000 });
  return samples;
};

export const mergeMetrics = (
  application: ApplicationDetails,
  components: { [key: string]: ApplicationComponentDetails[] },
) => {
  let metricsCPU: MetricItem[] = [];
  let metricsMemory: MetricItem[] = [];
  let componentList: ApplicationComponentDetails[] = components[application.name] || [];

  componentList.forEach((component) => {
    const pods: PodStatus[] = component.pods || [];
    pods.map((pod) => {
      const cpuList: MetricList = pod?.metrics?.cpu || [];
      cpuList.map((cpu, index) => {
        const x = cpu.x || 0;
        const mergedValue = (metricsCPU[index]?.y || 0) + (cpu.y || 0);
        metricsCPU[index] = { x: x, y: mergedValue };
        return cpu;
      });
      const memoryList: MetricList = pod?.metrics?.memory || [];
      memoryList.map((memory, index) => {
        const x = memory.x || 0;
        const mergedValue = (metricsMemory[index]?.y || 0) + (memory.y || 0);
        metricsMemory[index] = { x: x, y: mergedValue };
        return memory;
      });
      return pod;
    });
    return component;
  });
  application.metrics.cpu = metricsCPU;
  application.metrics.memory = metricsMemory;
  return application;
};

export const generateRandomIntList = (count: number, min: number, max: number) => {
  const list = Array<number>();
  for (let index = 0; index < count; index++) {
    list.push(Math.floor(Math.random() * max) + min);
  }
  return list;
};
