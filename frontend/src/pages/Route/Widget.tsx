import {
  Box,
  Card,
  CardContent,
  createStyles,
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
import Immutable from "immutable";
import { Methods } from "pages/Route/Methods";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { HttpRoute } from "types/route";
import { CopyAsCurl } from "widgets/CopyAsCurl";
import { OpenInBrowser } from "widgets/OpenInBrowser";
import { Targets } from "widgets/Targets";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CenterTypography } from "widgets/Label";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  activeNamespaceName: string;
  routes: Immutable.List<HttpRoute>;
}

interface State {}

class RouteWidgetRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderRouteItem = (route: HttpRoute, index: number) => {
    const { activeNamespaceName } = this.props;
    const scheme = route.get("schemes").size > 1 ? "http(s)" : route.get("schemes").get(0);
    const hosts = route.get("hosts");
    const paths = route.get("paths");
    return (
      <TableRow key={`route_${index}`}>
        <TableCell>
          <Methods methods={route.get("methods")} />
        </TableCell>
        <TableCell>{scheme + "://"}</TableCell>
        <TableCell>
          {hosts.map((x) => (
            <Box key={x}>{x}</Box>
          ))}
        </TableCell>
        <TableCell>
          {paths.map((x) => (
            <Box key={x}>{x}</Box>
          ))}
        </TableCell>
        <TableCell>
          <Targets activeNamespaceName={activeNamespaceName} destinations={route.get("destinations")} />
        </TableCell>
        <TableCell>
          <OpenInBrowser route={route} />
          <CopyAsCurl route={route} />
        </TableCell>
      </TableRow>
    );
  };

  public render() {
    const { classes, routes } = this.props;

    return (
      <Card className={classes.root} variant="outlined">
        <CardContent>
          <TableContainer>
            <Table size="small" aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <TableCell>Methods</TableCell>
                  <TableCell>Schemes</TableCell>
                  <TableCell>Hosts</TableCell>
                  <TableCell>Paths</TableCell>
                  <TableCell>Targets</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {routes.map((route, index) => {
                  return this.renderRouteItem(route, index);
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
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
    <FlexRowItemCenterBox>
      {routes.size > 0 ? (
        <RouteWidget routes={routes} activeNamespaceName={activeNamespaceName} />
      ) : (
        <CenterTypography>No Route</CenterTypography>
      )}
    </FlexRowItemCenterBox>
  );
};
