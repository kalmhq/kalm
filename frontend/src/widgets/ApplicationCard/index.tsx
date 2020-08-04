import {
  Avatar,
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardProps,
  createStyles,
  Grid,
  IconButton,
  Popover,
  Theme,
  WithStyles,
  withStyles,
} from "@material-ui/core";
import { blinkTopProgressAction } from "actions/settings";
import Immutable from "immutable";
import { POPPER_ZINDEX } from "layout/Constants";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
import { RouteWidgets } from "pages/Route/Widget";
import React from "react";
import { ApplicationComponentDetails, ApplicationDetails } from "types/application";
import { HttpRoute } from "types/route";
import { getApplicationCreatedAtString } from "utils/application";
import { stringToColor } from "utils/color";
import { pluralize } from "utils/string";
import { DoughnutChart } from "widgets/DoughnutChart";
import { FoldButtonGroup } from "widgets/FoldButtonGroup";
import { DeleteIcon, KalmApplicationIcon, KalmComponentsIcon, KalmDetailsIcon, KalmRoutesIcon } from "widgets/Icon";
import { IconButtonWithTooltip, IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { Caption, H6 } from "widgets/Label";
import { KLink, KMLink } from "widgets/Link";
import { CardCPULineChart, CardMemoryLineChart } from "widgets/SmallLineChart";

const ApplicationCardStyles = (theme: Theme) =>
  createStyles({
    root: {
      border: "1px solid rgba(0, 0, 0, 0.12)",
      background: theme.palette.background.paper,
      maxWidth: 310,
      minWidth: 290,
    },
    avatar: {},
    actionArea: {
      borderTop: "1px solid rgba(0, 0, 0, 0.12)",
      paddingLeft: theme.spacing(2),
    },
    actionContainer: {
      alignItems: "center",
    },
  });

type ApplicationCardProps = {
  application: ApplicationDetails;
  componentsMap: Immutable.Map<string, Immutable.List<ApplicationComponentDetails>>;
  httpRoutes: Immutable.List<HttpRoute>;
  activeNamespaceName: string;
  showDeleteConfirmDialog: (deletingApplicationListItem: ApplicationDetails) => void;
} & CardProps &
  WithStyles<typeof ApplicationCardStyles>;

class ApplicationCardRaw extends React.PureComponent<ApplicationCardProps, {}> {
  private renderName = () => {
    const { application } = this.props;
    return (
      <KLink to={`/applications/${application.get("name")}/components`} onClick={() => blinkTopProgressAction()}>
        <H6>{application.get("name")}</H6>
      </KLink>
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

    return <Caption>{components ? getApplicationCreatedAtString(components) : "-"}</Caption>;
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
    const { httpRoutes, activeNamespaceName, application } = this.props;

    if (httpRoutes && httpRoutes.size > 0) {
      return (
        <PopupState variant="popover" popupId={application.get("name")}>
          {(popupState) => (
            <>
              <KMLink component="button" variant="body2" {...bindTrigger(popupState)}>
                {pluralize("route", httpRoutes.size)}
              </KMLink>
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
                  <RouteWidgets routes={httpRoutes} activeNamespaceName={activeNamespaceName} />
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

  private getPieChartData() {
    const { componentsMap, application } = this.props;
    const components = componentsMap.get(application.get("name"));

    let componentSize = 0;
    let componentSuccess = 0;
    let componentPending = 0;
    let componentError = 0;
    let podSize = 0;
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

    componentSize = componentSuccess + componentPending + componentError;
    podSize = podSuccess + podPending + podError;

    return {
      componentSize,
      componentSuccess,
      componentPending,
      componentError,
      podSize,
      podSuccess,
      podPending,
      podError,
    };
  }

  private renderDoughnutChartStatus = () => {
    const pieChartData = this.getPieChartData();
    const { httpRoutes } = this.props;
    return (
      <Box display="flex" justifyContent={"space-around"}>
        <DoughnutChart
          title={pluralize("Component", pieChartData.componentSize)}
          labels={["Running", "Pending", "Error"]}
          data={[pieChartData.componentSuccess, pieChartData.componentPending, pieChartData.componentError]}
          icon={<KalmComponentsIcon />}
        />
        <DoughnutChart
          title={pluralize("Pod", pieChartData.podSize)}
          labels={["Running", "Pending", "Error"]}
          data={[pieChartData.podSuccess, pieChartData.podPending, pieChartData.podError]}
          icon={<KalmApplicationIcon />}
        />
        <DoughnutChart
          title={pluralize("Route", httpRoutes.size)}
          labels={["Running"]}
          data={[httpRoutes.size]}
          icon={<KalmRoutesIcon />}
        />
      </Box>
    );
  };

  private renderMoreActions = () => {
    const { application, showDeleteConfirmDialog } = this.props;
    let options = [
      {
        text: "Details",
        to: `/applications/${application.get("name")}/components`,
        icon: <KalmDetailsIcon />,
      },
      {
        text: "Delete",
        onClick: () => {
          showDeleteConfirmDialog(application);
        },
        icon: <DeleteIcon />,
        requiredRole: "writer",
      },
    ];
    return <FoldButtonGroup options={options} />;
  };

  private renderActions = () => {
    const { application, showDeleteConfirmDialog } = this.props;
    return (
      <>
        <IconLinkWithToolTip
          onClick={() => {
            blinkTopProgressAction();
          }}
          // size="small"
          tooltipTitle="Details"
          to={`/applications/${application.get("name")}/components`}
        >
          <KalmDetailsIcon />
        </IconLinkWithToolTip>
        <IconButtonWithTooltip
          tooltipTitle="Delete"
          aria-label="delete"
          onClick={() => {
            blinkTopProgressAction();
            showDeleteConfirmDialog(application);
          }}
        >
          <DeleteIcon />
        </IconButtonWithTooltip>
      </>
    );
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
            <Grid item xs={12} sm={12} md={12} lg={12} style={{ paddingBottom: 10 }}>
              {this.renderDoughnutChartStatus()}
            </Grid>
            <Grid container spacing={1}>
              <Grid item xs={3} sm={3} md={3} lg={3}>
                <Caption>CPU:</Caption>
              </Grid>
              <Grid item xs={9} sm={9} md={9} lg={9}>
                {this.renderCPU()}
              </Grid>
            </Grid>
            <Grid container spacing={1}>
              <Grid item xs={3} sm={3} md={3} lg={3}>
                <Caption>Memory:</Caption>
              </Grid>
              <Grid item xs={9} sm={9} md={9} lg={9}>
                {this.renderMemory()}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions className={classes.actionArea}>
          <Grid container className={classes.actionContainer}>
            <Grid item>{this.renderExternalAccesses()}</Grid>
            <Grid item style={{ marginLeft: "auto" }}>
              {this.renderActions()}
            </Grid>
          </Grid>
        </CardActions>
      </Card>
    );
  }
}

export const ApplicationCard = withStyles(ApplicationCardStyles)(ApplicationCardRaw);
