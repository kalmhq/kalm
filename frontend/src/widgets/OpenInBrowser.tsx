import { Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "store";
import { TDispatchProp } from "types";
import { ClusterInfo } from "types/cluster";
import { HttpRoute } from "types/route";
import { OpenInBrowserIcon } from "./Icon";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {
    clusterInfo: state.cluster.info,
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  route: HttpRoute;
  showIconButton?: boolean;
}

class OpenInBrowserRaw extends React.PureComponent<Props> {
  public render() {
    const { route, clusterInfo, showIconButton } = this.props;
    if (showIconButton) {
      return (
        <IconButtonWithTooltip
          tooltipTitle="Open In Browser"
          disabled={!route.methods.includes("GET")}
          href={getRouteUrl(route, clusterInfo)}
          // @ts-ignore
          target="_blank"
          rel="noreferrer"
        >
          <OpenInBrowserIcon />
        </IconButtonWithTooltip>
      );
    }

    return (
      <Button
        size="small"
        variant="outlined"
        disabled={!route.methods.includes("GET")}
        href={getRouteUrl(route, clusterInfo)}
        target="_blank"
        rel="noreferrer"
      >
        Open in browser
      </Button>
    );
  }
}

export const OpenInBrowser = withStyles(styles)(connect(mapStateToProps)(OpenInBrowserRaw));

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
