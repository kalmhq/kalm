import { HttpRoute } from "types/route";

export const displaySvcNameUnder = (serviceName: string, namespace: string) => {
  serviceName = serviceName.replace(".svc.cluster.local", "");
  serviceName = serviceName.replace(`.${namespace}`, "");
  return serviceName;
};

export const displayRouteWeightAsPercentage = (route: HttpRoute, weight: number) => {
  let sum = 0;
  route.get("destinations").forEach((d) => (sum += d.get("weight")));

  return Math.floor((weight / sum) * 100 + 0.5) + "%";
};
