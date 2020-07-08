import Immutable from "immutable";
import {
  ApplicationComponentDetails,
  ApplicationDetails,
  PodStatus,
  // ApplicationDetails,
  // LOAD_ALL_NAMESAPCES_COMPONETS,
  // LOAD_APPLICATIONS_FAILED,
  // LOAD_APPLICATIONS_FULFILLED,
  // LOAD_APPLICATIONS_PENDING,
} from "types/application";
import { MetricList, MetricItem } from "types/common";

export const createApplication = (name: string) => {
  return Immutable.fromJS({
    name: name,
    metrics: {
      cpu: getCPUSamples(4),
      memory: getMemorySamples(172149760),
    },
    roles: ["writer", "reader"],
    status: "Active",
  });
};

export const createApplicationComponent = (name: string, podCount: number, createTS: number) => {
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
export const createApplicationComponentDetails = (createTS: number) => {
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
  let cpuSegments: Immutable.List<MetricItem> = Immutable.List();
  const fromTS = from.getTime();
  const validateRange = [value - thresholds > 0 ? value - thresholds : 0, value + thresholds];

  for (let index = 0; index < counter; index++) {
    let lastValue = validateRange[0];
    let value = Math.floor(Math.random() * validateRange[1]) + validateRange[0];
    if (index > 0) {
      lastValue = cpuSegments.get(index - 1)?.get("y") as number;
      const seed = Math.floor(Math.random() * 3) + 1;
      const direction = seed >= 2 ? 1 : -1;
      value = lastValue + (direction * thresholds * 1) / 4;
      value = Math.max(validateRange[0], Math.min(value, validateRange[1]));
    }

    const element: MetricItem = Immutable.Map({ x: fromTS + 500 * index, y: value });
    cpuSegments = cpuSegments.push(element);
  }
  return cpuSegments;
};

export const getCPUSamples = (value: any) => {
  let samples = createMetricsSegements({ value: value });
  console.log(samples.toJS());

  return samples.toJS();
};

export const getMemorySamples = (value: any) => {
  let samples = createMetricsSegements({ value: value, thresholds: 10000 });
  return samples.toJS();
};

export const mergeMetrics = (
  application: ApplicationDetails,
  components: Immutable.Map<string, Immutable.List<ApplicationComponentDetails>>,
) => {
  let metricsCPU: Immutable.List<MetricItem> = Immutable.List();
  let metricsMemory: Immutable.List<MetricItem> = Immutable.List();
  let componentList: Immutable.List<ApplicationComponentDetails> = components.get(
    application.get("name"),
    Immutable.List<ApplicationComponentDetails>(),
  );
  componentList.map((component) => {
    const pods: Immutable.List<PodStatus> = component.getIn(["pods"], Immutable.List<PodStatus>());
    pods.map((pod) => {
      const cpuList: MetricList = pod.getIn(["metrics", "cpu"], Immutable.List<MetricItem>());
      cpuList.map((cpu, index) => {
        const x = cpu.get("x", 0);
        const mergedValue =
          metricsCPU.get(index, Immutable.Map({ x: 0, y: 0 }) as MetricItem).get("y", 0) + cpu.get("y", 0);
        metricsCPU = metricsCPU.set(index, Immutable.fromJS({ x: x, y: mergedValue }));
        return cpu;
      });
      const memoryList: MetricList = pod.getIn(["metrics", "memory"], Immutable.List<MetricItem>());
      memoryList.map((memory, index) => {
        const x = memory.get("x", 0);
        const mergedValue =
          metricsMemory.get(index, Immutable.Map({ x: 0, y: 0 }) as MetricItem).get("y", 0) + memory.get("y", 0);
        metricsMemory = metricsMemory.set(index, Immutable.fromJS({ x: x, y: mergedValue }));
        return memory;
      });
      return pod;
    });
    return component;
  });
  application = application.setIn(["metrics", "cpu"], metricsCPU);
  application = application.setIn(["metrics", "memory"], metricsMemory);
  return application;
};
