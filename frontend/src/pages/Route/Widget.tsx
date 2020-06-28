import React from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  createStyles,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Theme,
  withStyles,
  WithStyles,
} from "@material-ui/core";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { HttpRoute } from "types/route";
import { maxIn } from "permission/utils";
import { Methods } from "pages/Route/Methods";
import { displayRouteWeightAsPercentage, displaySvcNameUnder } from "pages/Route/util";
import { ArrowRightAlt } from "@material-ui/icons";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { TDispatchProp } from "types";
import { isPrivateIP } from "utils/ip";
import Immutable from "immutable";

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
  activeNamespaceName: string;
  route: HttpRoute;
}

interface State {}

class RouteWidgetRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

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

  private buildCurlCommand = (scheme: string, host: string, path: string, method: string) => {
    const { clusterInfo } = this.props;
    let extraArgs: string[] = [];
    if (isPrivateIP(clusterInfo.get("ingressIP"))) {
      if (scheme === "https") {
        if (!host.includes(":")) {
          host = host + ":" + clusterInfo.get("httpsPort");
        }
        extraArgs.push(`-k`);
      } else {
        if (!host.includes(":")) {
          extraArgs.push(`-H "Host: ${host}"`);
          host = host + ":" + clusterInfo.get("httpPort");
        }
      }
      extraArgs.push(`--resolve ${host}:${clusterInfo.get("ingressIP")}`);
    }
    const url = `${scheme}://${host}${path}`;
    return `curl -v -X ${method}${extraArgs.map((x) => " " + x).join("")} ${url}`;
  };

  private copyAsCurl = () => {
    const { dispatch, route } = this.props;

    const scheme = route.get("schemes").first("http");
    const host = route.get("hosts").first("");

    const path = route.get("paths").first("/");
    const method = route.get("methods").first("GET");

    navigator.clipboard.writeText(this.buildCurlCommand(scheme, host, path, method)).then(
      function () {
        dispatch(setSuccessNotificationAction("Copied successful!"));
      },
      function (err) {
        dispatch(setErrorNotificationAction("Copied failed!"));
      },
    );
  };

  public render() {
    const { classes, route, activeNamespaceName } = this.props;
    const rowNumbers = maxIn(route.get("hosts").size, route.get("schemes").size, route.get("paths").size);

    return (
      <div>
        <Card className={classes.root} variant="outlined">
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <TableContainer>
                  <Table size="small" aria-label="a dense table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Methods</TableCell>
                        <TableCell>Schemes</TableCell>
                        <TableCell>Hosts</TableCell>
                        <TableCell>Paths</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...Array(rowNumbers)].map((_, i) => {
                        const scheme = route.get("schemes").get(i);
                        const host = route.get("hosts").get(i);
                        const path = route.get("paths").get(i);
                        return (
                          <TableRow key={i}>
                            <TableCell>{i === 0 && <Methods methods={route.get("methods")} />}</TableCell>
                            <TableCell>{scheme + "://"}</TableCell>
                            <TableCell>{host}</TableCell>
                            <TableCell>{path}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={1} style={{ textAlign: "center" }}>
                <ArrowRightAlt />
              </Grid>
              <Grid item xs>
                <TableContainer>
                  <Table size="small" aria-label="a dense table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Targets</TableCell>
                        <TableCell>Weight</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {route.get("destinations").map((destination, index) => {
                        return (
                          <TableRow key={destination.get("host") + "-" + index}>
                            <TableCell>{displaySvcNameUnder(destination.get("host"), activeNamespaceName)}</TableCell>
                            <TableCell>{displayRouteWeightAsPercentage(route, destination.get("weight"))}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </CardContent>
          <CardActions>
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
            <Button size="small" variant="outlined" onClick={this.copyAsCurl}>
              Copy as curl
            </Button>
          </CardActions>
        </Card>
      </div>
    );
  }
}

export const RouteWidget = withStyles(styles)(connect(mapStateToProps)(RouteWidgetRaw));

export const RouteWidgets = ({
  routes,
  activeNamespaceName,
}: {
  routes: Immutable.List<HttpRoute>;
  activeNamespaceName: string;
}) => {
  return (
    <>
      {routes
        .map((route, i) => {
          return (
            <Box mb={i < routes.size - 1 ? 2 : 0} key={route.get("name")}>
              <RouteWidget route={route} activeNamespaceName={activeNamespaceName} />
            </Box>
          );
        })
        .toArray()}
    </>
  );
};
