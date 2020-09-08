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
import { getRouteUrl } from "widgets/OpenInBrowser";
import { Targets } from "widgets/Targets";
import { CenterTypography } from "widgets/Label";
import { FlexRowItemCenterBox } from "widgets/Box";
import DomainStatus from "widgets/DomainStatus";
import { KMLink } from "widgets/Link";
import { ItemWithHoverIcon } from "widgets/ItemWithHoverIcon";
import { blinkTopProgressAction } from "actions/settings";
import { EditIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";

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
  routes: Immutable.List<HttpRoute>;
  canEdit: boolean;
}

interface State {}

class RouteWidgetRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderRouteItem = (route: HttpRoute, index: number) => {
    const { clusterInfo, canEdit } = this.props;
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
          {hosts.map((h) => {
            const url = getRouteUrl(route, clusterInfo, h);
            return (
              <FlexRowItemCenterBox key={h}>
                <DomainStatus mr={1} domain={h} />
                <ItemWithHoverIcon icon={<CopyAsCurl route={route} host={h} showIconButton />}>
                  <KMLink href={url} target="_blank" rel="noopener noreferrer">
                    {h}
                  </KMLink>
                </ItemWithHoverIcon>
              </FlexRowItemCenterBox>
            );
          })}
        </TableCell>
        <TableCell>
          {paths.map((x) => (
            <Box key={x}>{x}</Box>
          ))}
        </TableCell>
        <TableCell>
          <Targets destinations={route.get("destinations")} />
        </TableCell>
        <TableCell>
          {canEdit && (
            <IconLinkWithToolTip
              onClick={() => {
                blinkTopProgressAction();
              }}
              tooltipTitle="Edit"
              to={`/routes/${route.get("name")}/edit`}
            >
              <EditIcon />
            </IconLinkWithToolTip>
          )}
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

export const RouteWidgets = ({ routes, canEdit }: { routes: Immutable.List<HttpRoute>; canEdit: boolean }) => {
  return (
    <>
      {routes.size > 0 ? (
        <RouteWidget routes={routes} canEdit={canEdit} />
      ) : (
        <CenterTypography>No Routes</CenterTypography>
      )}
    </>
  );
};
