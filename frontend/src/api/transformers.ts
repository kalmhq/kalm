import { Application, ApplicationDetails } from "types/application";
import { Namespace } from "types/k8s";

export const k8sToKalmNamespace = (ns: Namespace): ApplicationDetails => {
  return {
    name: ns.metadata.name,
    metrics: { isMetricServerEnabled: false, cpu: [], memory: [] },
    status: ns.metadata.deletionTimestamp ? "Terminating" : "Active",
    roles: [],
  };
};

export const kalmToK8sNamespace = (ns: Application): Namespace => {
  return {
    kind: "Namespace",
    apiVersion: "v1",
    metadata: {
      name: ns.name,
      labels: {
        "istio-injection": "enabled",
        "kalm-enabled": "true",
      },
    },
  };
};
