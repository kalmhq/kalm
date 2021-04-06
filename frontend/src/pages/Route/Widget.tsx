import {
  Box,
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
import { blinkTopProgressAction } from "actions/settings";
import { RootState } from "configureStore";
import { Methods } from "pages/Route/Methods";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { HttpRoute } from "types/route";
import { FlexRowItemCenterBox } from "widgets/Box";
import { EditIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { CenterTypography } from "widgets/Label";
import { KMLink } from "widgets/Link";
import { getRouteUrl } from "widgets/OpenInBrowser";
import { Targets } from "widgets/Targets";

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
  canEdit: boolean;
  routes: HttpRoute[];
}

interface State {}

class RouteWidgetRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderRouteItem = (route: HttpRoute, index: number) => {
    const { clusterInfo, canEdit } = this.props;
    const scheme = route.schemes.length > 1 ? "http(s)" : route.schemes[0];
    const hosts = route.hosts;
    const paths = route.paths;
    return (
      <TableRow key={`route_${index}`}>
        <TableCell>
          <Methods methods={route.methods} />
        </TableCell>
        <TableCell>{scheme + "://"}</TableCell>
        <TableCell>
          {hosts.map((h) => {
            const url = getRouteUrl(route, clusterInfo, h);
            return (
              <FlexRowItemCenterBox key={h}>
                {/* <ItemWithHoverIcon icon={<CopyAsCurl route={route} host={h} showIconButton />}> */}
                <KMLink href={url} target="_blank" rel="noopener noreferrer">
                  {h}
                </KMLink>
                {/* </ItemWithHoverIcon> */}
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
          <Targets destinations={route.destinations} destinationsStatus={route.destinationsStatus} />
        </TableCell>
        <TableCell>
          {canEdit && (
            <IconLinkWithToolTip
              onClick={() => {
                blinkTopProgressAction();
              }}
              tooltipTitle="Edit"
              to={`/routes/${route.name}/edit`}
            >
              <EditIcon />
            </IconLinkWithToolTip>
          )}
        </TableCell>
      </TableRow>
    );
  };

  public render() {
    const { routes } = this.props;

    return (
      // <Card className={classes.root} variant="outlined">
      // <CardContent>
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
      // </CardContent>
      // </Card>
    );
  }
}

export const RouteWidget = withStyles(styles)(connect(mapStateToProps)(RouteWidgetRaw));

export const RouteWidgets = ({ routes, canEdit }: { routes: HttpRoute[]; canEdit: boolean }) => {
  return (
    <>
      {routes.length > 0 ? (
        <RouteWidget routes={routes} canEdit={canEdit} />
      ) : (
        <CenterTypography>No Routes</CenterTypography>
      )}
    </>
  );
};
