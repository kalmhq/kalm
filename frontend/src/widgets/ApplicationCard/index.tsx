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
} from "@material-ui/core";
import { ApplicationDetails, ApplicationComponentDetails } from "types/application";
import { stringToColor } from "utils/color";
import { Body } from "widgets/Label";
import { getApplicationCreatedAtString } from "utils/application";
import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
import { HttpRoute } from "types/route";
import PopupState, { bindTrigger, bindPopover } from "material-ui-popup-state";
import { RouteWidgets } from "pages/Route/Widget";
import { POPPER_ZINDEX } from "layout/Constants";
import { blinkTopProgressAction } from "actions/settings";
import { Link } from "react-router-dom";
import { primaryColor } from "theme/theme";
import { FlexRowItemCenterBox } from "widgets/Box";
import { SuccessBadge, PendingBadge, ErrorBadge } from "widgets/Badge";
import { DeleteIcon, KalmDetailsIcon } from "widgets/Icon";
import { FoldButtonGroup } from "widgets/FoldButtonGroup";

const ApplicationCardStyles = (theme: Theme) =>
  createStyles({
    root: {},
    avatar: {},
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
        {application.get("name")}
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
    return <SmallCPULineChart data={metrics.get("cpu")} hoverText={this.hasPods() ? "" : "No data"} />;
  };

  private renderMemory = () => {
    const { application } = this.props;
    const metrics = application.get("metrics");
    return <SmallMemoryLineChart data={metrics.get("memory")} hoverText={this.hasPods() ? "" : "No data"} />;
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
        <Tooltip title={tooltipTitle} enterDelay={500}>
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
      <Card>
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
          {this.renderStatus()}
          {this.renderCPU()}
          {this.renderMemory()}
        </CardContent>
        <CardActions disableSpacing>
          {this.renderExternalAccesses()}
          <div style={{ marginLeft: "auto" }}>{this.renderMoreActions()}</div>
          {/* <IconButton aria-label="add to favorites">
            <FavoriteIcon />
          </IconButton>
          <IconButton aria-label="share">
            <ShareIcon />
          </IconButton>
          <IconButton
            className={clsx(classes.expand, {
              [classes.expandOpen]: expanded,
            })}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
          >
            <ExpandMoreIcon />
          </IconButton> */}
        </CardActions>
      </Card>
    );
  }
}

export const ApplicationCard = withStyles(ApplicationCardStyles)(ApplicationCardRaw);
