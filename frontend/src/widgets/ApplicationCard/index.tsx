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
  Typography,
  WithStyles,
  withStyles,
} from "@material-ui/core";
import { blinkTopProgressAction } from "actions/settings";
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
import { KalmApplicationIcon, KalmComponentsIcon, KalmDetailsIcon, KalmRoutesIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { Caption, H6 } from "widgets/Label";
import { KLink, KMLink } from "widgets/Link";
import { CardCPULineChart, CardMemoryLineChart } from "widgets/SmallLineChart";

const ApplicationCardStyles = (theme: Theme) =>
  createStyles({
    root: {
      border: `1px solid ${theme.palette.divider}`,
      background: theme.palette.background.paper,
      maxWidth: 310,
      minWidth: 290,
    },
    avatar: {},
    actionArea: {
      borderTop: `1px solid ${theme.palette.divider}`,
      paddingLeft: theme.spacing(2),
    },
    actionContainer: {
      alignItems: "center",
    },
  });

type ApplicationCardProps = {
  application: ApplicationDetails;
  componentsMap: { [key: string]: ApplicationComponentDetails[] };
  httpRoutes: HttpRoute[];
  canEdit: boolean;
  confirmDelete: (application: ApplicationDetails) => void;
} & CardProps &
  WithStyles<typeof ApplicationCardStyles>;

class ApplicationCardRaw extends React.PureComponent<ApplicationCardProps, {}> {
  private renderName = () => {
    const { application } = this.props;
    return (
      <KLink to={`/applications/${application.name}/components`} onClick={() => blinkTopProgressAction()}>
        <H6>{application.name}</H6>
      </KLink>
    );
  };
  private hasPods = () => {
    const { componentsMap, application } = this.props;
    let count = 0;
    componentsMap[application.name]?.forEach((component) => {
      component.pods?.forEach((podStatus) => {
        count++;
      });
    });

    return count !== 0;
  };
  private renderCreatedAt = () => {
    const { componentsMap, application } = this.props;
    const components = componentsMap[application.name];

    return <Caption>{components ? getApplicationCreatedAtString(components) : "-"}</Caption>;
  };

  private renderCPU = () => {
    const { application } = this.props;
    const metrics = application.metrics;
    return <CardCPULineChart data={metrics.cpu} hoverText={this.hasPods() ? "" : "No data"} />;
  };

  private renderMemory = () => {
    const { application } = this.props;
    const metrics = application.metrics;
    return <CardMemoryLineChart data={metrics.memory} hoverText={this.hasPods() ? "" : "No data"} />;
  };

  private renderExternalAccesses = () => {
    const { httpRoutes, application, canEdit } = this.props;
    const applicationName = application.name;
    if (httpRoutes && httpRoutes.length > 0) {
      return (
        <PopupState variant="popover" popupId={applicationName}>
          {(popupState) => (
            <>
              <KMLink component="button" variant="body2" {...bindTrigger(popupState)}>
                {pluralize("route", httpRoutes.length)}
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
                  <RouteWidgets routes={httpRoutes} canEdit={canEdit} />
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
    const components = componentsMap[application.name];

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
      component.pods?.forEach((pod) => {
        if (pod.status === "Succeeded" || pod.status === "Running") {
          podSuccess = podSuccess + 1;
        } else if (pod.status === "Failed") {
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
          title={pluralize("Route", httpRoutes.length)}
          labels={["Running"]}
          data={[httpRoutes.length]}
          icon={<KalmRoutesIcon />}
        />
      </Box>
    );
  };

  private renderActions = () => {
    const { application, confirmDelete, canEdit } = this.props;
    return (
      <>
        <IconLinkWithToolTip
          onClick={() => {
            blinkTopProgressAction();
          }}
          // size="small"
          tooltipTitle="Details"
          to={`/applications/${application.name}/components`}
        >
          <KalmDetailsIcon />
        </IconLinkWithToolTip>
        {canEdit && (
          <DeleteButtonWithConfirmPopover
            popupId="delete-application-popup"
            popupTitle="DELETE APPLICATION?"
            popupContent={
              <Box>
                This action cannot be undone. This will permanently delete all resources under namespace{" "}
                <Typography color={"primary"} align={"center"}>
                  {application.name}
                </Typography>
                includes: components, environment configs, config files etc.
              </Box>
            }
            targetText={application.name}
            confirmedAction={() => confirmDelete(application)}
          />
        )}
      </>
    );
  };

  public render() {
    const { application, classes } = this.props;
    return (
      <Card raised={false} elevation={0} className={classes.root}>
        <CardHeader
          avatar={
            <Avatar
              aria-label="recipe"
              className={classes.avatar}
              style={{
                background: stringToColor(application.name),
              }}
            >
              {application.name.toUpperCase().slice(0, 1)}
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
