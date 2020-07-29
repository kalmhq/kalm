import { Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { HttpRoute } from "types/route";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";
import { OpenInBrowserIcon } from "./Icon";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {
    clusterInfo: state.get("cluster").get("info"),
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  route: HttpRoute;
  showIconButton?: boolean;
}

class OpenInBrowserRaw extends React.PureComponent<Props> {
  private getUrl = () => {
    const { route, clusterInfo } = this.props;

    let host = route.get("hosts").first("*");
    const scheme = route.get("schemes").first();
    const path = route.get("paths").first("/");

    if (host === "*") {
      host =
        (clusterInfo.get("ingressIP") || clusterInfo.get("ingressHostname")) +
        ":" +
        clusterInfo.get(scheme === "https" ? "httpsPort" : "httpPort");
    }

    if (host.includes("*")) {
      host = host.replace("*", "wildcard");
    }

    return scheme + "://" + host + path;
  };
  public render() {
    const { route, showIconButton } = this.props;
    if (showIconButton) {
      return (
        <IconButtonWithTooltip
          tooltipTitle="Open In Browser"
          disabled={!route.get("methods").includes("GET")}
          href={this.getUrl()}
          // @ts-ignore
          target="_blank"
          rel="noreferer"
        >
          <OpenInBrowserIcon />
        </IconButtonWithTooltip>
      );
    }

    return (
      <Button
        size="small"
        variant="outlined"
        disabled={!route.get("methods").includes("GET")}
        href={this.getUrl()}
        target="_blank"
        rel="noreferer"
      >
        Open in browser
      </Button>
    );
  }
}

export const OpenInBrowser = withStyles(styles)(connect(mapStateToProps)(OpenInBrowserRaw));
