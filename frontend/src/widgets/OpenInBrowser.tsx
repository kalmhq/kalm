import { ClusterInfo } from "types/cluster";
import { HttpRoute } from "types/route";
/**
 * Get the URL string of a Route object
 */
export const getRouteUrl = (route: HttpRoute, clusterInfo: ClusterInfo, customHost?: string) => {
  let host = customHost ? customHost : route.hosts[0] || "*";
  const scheme = route.schemes[0];
  // TODO: Grabbing the first host and first url is probably not sufficient here.
  // What is the right behavior when we are dealing with a row with 2 hosts and 2 paths?
  const path = route.paths[0] || "/";

  if (host === "*") {
    host =
      (clusterInfo.ingressIP || clusterInfo.ingressHostname) +
      ":" +
      clusterInfo[scheme === "https" ? "httpsPort" : "httpPort"];
  }

  if (host.includes("*")) {
    host = host.replace("*", "wildcard");
  }

  return scheme + "://" + host + path;
};
