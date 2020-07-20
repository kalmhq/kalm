import React from "react";
import Immutable from "immutable";
import {
  WithStyles,
  CardProps,
  Theme,
  createStyles,
  withStyles,
  Card,
  IconButton,
  CardHeader,
  Avatar,
  CardContent,
  Link as MLink,
  Popover,
  Box,
  CardActions,
  Tooltip,
  Grid,
} from "@material-ui/core";
import { ApplicationDetails, ApplicationComponentDetails } from "types/application";
import { stringToColor } from "utils/color";
import { Body, H4 } from "widgets/Label";
import { getApplicationCreatedAtString } from "utils/application";
import { CardCPULineChart, CardMemoryLineChart } from "widgets/SmallLineChart";
import { HttpRoute } from "types/route";
import PopupState, { bindTrigger, bindPopover } from "material-ui-popup-state";
import { RouteWidgets } from "pages/Route/Widget";
import { POPPER_ZINDEX } from "layout/Constants";
import { blinkTopProgressAction } from "actions/settings";
import { Link } from "react-router-dom";
import { primaryColor } from "theme/theme";
import { FlexRowItemCenterBox } from "widgets/Box";
import { SuccessBadge, PendingBadge, ErrorBadge } from "widgets/Badge";
import { DeleteIcon, KalmDetailsIcon, KalmComponentsIcon, KalmApplicationIcon, KalmRoutesIcon } from "widgets/Icon";
import { FoldButtonGroup } from "widgets/FoldButtonGroup";
import { DoughnutChart } from "widgets/DoughnutChart";

const ApplicationCardStyles = (theme: Theme) =>
  createStyles({
    root: {
      border: "1px solid rgba(0, 0, 0, 0.12)",
      background: theme.palette.background.paper,
      width: 310,
    },
    avatar: {},
    actionArea: {
      borderTop: "1px solid rgba(0, 0, 0, 0.12)",
      paddingLeft: theme.spacing(2),
    },
  });

type ApplicationCardProps = {
  application: ApplicationDetails;
  componentsMap: Immutable.Map<string, Immutable.List<ApplicationComponentDetails>>;
  routesMap: Immutable.Map<string, Immutable.List<HttpRoute>>;
  activeNamespaceName: string;
} & CardProps &
  WithStyles<typeof ApplicationCardStyles>;

class ApplicationCardRaw extends React.PureComponent<ApplicationCardProps, {}> {
  private renderName = () => {
    const { application } = this.props;
    return (
      <Link
        style={{ color: primaryColor }}
        to={`/applications/${application.get("name")}/components`}
        onClick={() => blinkTopProgressAction()}
      >
        <H4>{application.get("name")}</H4>
      </Link>
    );
  };
  private hasPods = () => {
    const { componentsMap, application } = this.props;
    let count = 0;
    componentsMap.get(application.get("name"))?.forEach((component) => {
      component.get("pods").forEach((podStatus) => {
        count++;
      });
    });

    return count !== 0;
  };
  private renderCreatedAt = () => {
    const { componentsMap, application } = this.props;
    const components = componentsMap.get(application.get("name"));

    return <Body>{components ? getApplicationCreatedAtString(components) : "-"}</Body>;
  };

  private renderCPU = () => {
    const { application } = this.props;
    const metrics = application.get("metrics");
    return <CardCPULineChart data={metrics.get("cpu")} hoverText={this.hasPods() ? "" : "No data"} />;
  };

  private renderMemory = () => {
    const { application } = this.props;
    const metrics = application.get("metrics");
    return <CardMemoryLineChart data={metrics.get("memory")} hoverText={this.hasPods() ? "" : "No data"} />;
  };

  private renderExternalAccesses = () => {
    const { routesMap, activeNamespaceName, application } = this.props;

    const applicationRoutes: Immutable.List<HttpRoute> = routesMap.get(application.get("name"), Immutable.List());

    if (applicationRoutes && applicationRoutes.size > 0) {
      return (
        <PopupState variant="popover" popupId={application.get("name")}>
          {(popupState) => (
            <>
              <MLink component="button" variant="body2" {...bindTrigger(popupState)}>
                {applicationRoutes.size === 1 ? "1 route" : `${applicationRoutes.size} routes`}
              </MLink>
              <Popover
                style={{ zIndex: POPPER_ZINDEX }}
                {...bindPopover(popupState)}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "center",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "center",
                }}
              >
                <Box p={2}>
                  <RouteWidgets routes={applicationRoutes} activeNamespaceName={activeNamespaceName} />
                </Box>
              </Popover>
            </>
          )}
        </PopupState>
      );
    } else {
      return "-";
    }
  };

  private renderStatus = () => {
    const { componentsMap, application } = this.props;

    let podCount = 0;
    let successCount = 0;
    let pendingCount = 0;
    let errorCount = 0;
    componentsMap.get(application.get("name"))?.forEach((component) => {
      component.get("pods").forEach((podStatus) => {
        podCount++;
        switch (podStatus.get("status")) {
          case "Running": {
            successCount++;
            break;
          }
          case "Pending": {
            pendingCount++;
            break;
          }
          case "Succeeded": {
            successCount++;
            break;
          }
          case "Failed": {
            errorCount++;
            break;
          }
        }
      });
    });

    if (podCount === 0) {
      return "No Pods";
    }

    const tooltipTitle = `Total ${podCount} pods are found. \n${successCount} ready, ${pendingCount} pending, ${errorCount} failed. Click to view details.`;

    return (
      <Link
        to={`/applications/${application.get("name")}/components`}
        style={{ color: primaryColor }}
        onClick={() => blinkTopProgressAction()}
      >
        <Tooltip title={tooltipTitle} enterDelay={500} style={{ justifyContent: "center" }}>
          <FlexRowItemCenterBox>
            {successCount > 0 ? (
              <FlexRowItemCenterBox mr={1}>
                <SuccessBadge />
                {successCount}
              </FlexRowItemCenterBox>
            ) : null}

            {pendingCount > 0 ? (
              <FlexRowItemCenterBox mr={1}>
                <PendingBadge />
                {pendingCount}
              </FlexRowItemCenterBox>
            ) : null}

            {errorCount > 0 ? (
              <FlexRowItemCenterBox>
                <ErrorBadge />
                {errorCount}
              </FlexRowItemCenterBox>
            ) : null}
          </FlexRowItemCenterBox>
        </Tooltip>
      </Link>
    );
  };

  private getPieChartData() {
    const { componentsMap, application } = this.props;
    const components = componentsMap.get(application.get("name"));

    let componentSuccess = 0;
    let componentPending = 0;
    let componentError = 0;
    let podSuccess = 0;
    let podPending = 0;
    let podError = 0;

    components?.forEach((component) => {
      let hasError = false;
      let hasPending = false;
      component.get("pods").forEach((pod) => {
        if (pod.get("status") === "Succeeded" || pod.get("status") === "Running") {
          podSuccess = podSuccess + 1;
        } else if (pod.get("status") === "Failed") {
          podError = podError + 1;
          hasError = true;
        } else {
          podPending = podPending + 1;
          hasPending = true;
        }
      });

      if (hasError) {
        componentError = componentError + 1;
      } else if (hasPending) {
        componentPending = componentPending + 1;
      } else {
        componentSuccess = componentSuccess + 1;
      }
    });

    return {
      componentSuccess,
      componentPending,
      componentError,
      podSuccess,
      podPending,
      podError,
    };
  }

  private renderDoughnutChartStatus = () => {
    const pieChartData = this.getPieChartData();
    const { routesMap, application } = this.props;
    const applicationRoutes: Immutable.List<HttpRoute> = routesMap.get(application.get("name"), Immutable.List());
    return (
      <Box display="flex" justifyContent={"space-around"}>
        <DoughnutChart
          title="Components"
          labels={["Running", "Pending", "Error"]}
          data={[pieChartData.componentSuccess, pieChartData.componentPending, pieChartData.componentError]}
          icon={<KalmComponentsIcon />}
        />
        <DoughnutChart
          title="Pods"
          labels={["Running", "Pending", "Error"]}
          data={[pieChartData.podSuccess, pieChartData.podPending, pieChartData.podError]}
          icon={<KalmApplicationIcon />}
        />
        <DoughnutChart title="Routes" labels={["Running"]} data={[applicationRoutes.size]} icon={<KalmRoutesIcon />} />
      </Box>
    );
  };

  private showDeleteConfirmDialog = (deletingApplicationListItem: ApplicationDetails) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingApplicationListItem,
    });
  };
  private renderMoreActions = () => {
    const { application } = this.props;
    let options = [
      {
        text: "Details",
        to: `/applications/${application.get("name")}/components`,
        icon: <KalmDetailsIcon />,
      },
      // {
      //   text: "Edit",
      //   to: `/applications/${rowData.get("name")}/edit`,
      //   iconName: "edit",
      //   requiredRole: "writer",
      // },
      {
        text: "Delete",
        onClick: () => {
          this.showDeleteConfirmDialog(application);
        },
        icon: <DeleteIcon />,
        requiredRole: "writer",
      },
    ];
    return <FoldButtonGroup options={options} />;
  };

  public render() {
    const { application, classes } = this.props;
    return (
      <Card raised={false} elevation={0} square className={classes.root}>
        <CardHeader
          avatar={
            <Avatar
              aria-label="recipe"
              className={classes.avatar}
              style={{
                background: stringToColor(application.get("name")),
              }}
            >
              {application.get("name").toUpperCase().slice(0, 1)}
            </Avatar>
          }
          action={<IconButton aria-label="settings">{/* <MoreVertIcon /> */}</IconButton>}
          title={this.renderName()}
          subheader={this.renderCreatedAt()}
        />
        <CardContent>
          <Grid container>
            <Grid item md={12} style={{ paddingBottom: 10 }}>
              {this.renderDoughnutChartStatus()}
              {/* {this.renderStatus()} */}
            </Grid>
            <Grid container>
              <Grid item md={3}>
                <Body>CPU:</Body>
              </Grid>
              <Grid item md={9}>
                {this.renderCPU()}
              </Grid>
            </Grid>
            <Grid container>
              <Grid item md={3}>
                <Body>Memory:</Body>
              </Grid>
              <Grid item md={9}>
                {this.renderMemory()}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions className={classes.actionArea}>
          <Grid container>
            <Grid item>{this.renderExternalAccesses()}</Grid>
            <Grid item style={{ marginLeft: "auto" }}>
              {this.renderMoreActions()}
            </Grid>
          </Grid>
        </CardActions>
      </Card>
    );
  }
}

export const ApplicationCard = withStyles(ApplicationCardStyles)(ApplicationCardRaw);
