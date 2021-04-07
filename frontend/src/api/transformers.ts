import { ApplicationDetails } from "types/application";
import { Namespace } from "types/k8s";

export const k8sToKalmNamespace = (ns: Namespace): ApplicationDetails => {
  return {
    name: ns.metadata.name,
    metrics: { isMetricServerEnabled: false, cpu: [], memory: [] },
    status: ns.metadata.deletionTimestamp ? "Terminating" : "Active",
    roles: [],
  };
};
