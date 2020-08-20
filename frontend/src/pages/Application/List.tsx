import { Box, Button, createStyles, Grid, Popover, Theme, Tooltip, WithStyles } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import withStyles from "@material-ui/core/styles/withStyles";
import { deleteApplicationAction } from "actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction, setSettingsAction } from "actions/settings";
import { push } from "connected-react-router";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { POPPER_ZINDEX } from "layout/Constants";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
import { RouteWidgets } from "pages/Route/Widget";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { primaryColor } from "theme/theme";
import { ApplicationDetails } from "types/application";
import { getApplicationCreatedAtString } from "utils/application";
import { pluralize } from "utils/string";
import sc from "utils/stringConstants";
import { ApplicationCard } from "widgets/ApplicationCard";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { KalmApplicationIcon, KalmDetailsIcon, KalmGridViewIcon, KalmListViewIcon } from "widgets/Icon";
import { IconButtonWithTooltip, IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { KRTable } from "widgets/KRTable";
import { Caption } from "widgets/Label";
import { KLink, KMLink } from "widgets/Link";
import { Loading } from "widgets/Loading";
import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
import { BasePage } from "../BasePage";

const styles = (theme: Theme) =>
  createStyles({
    emptyWrapper: {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      paddingTop: "110px",
    },
  });

const mapStateToProps = (state: RootState) => {
  const httpRoutes = state.get("routes").get("httpRoutes");
  const componentsMap = state.get("components").get("components");
  const clusterInfo = state.get("cluster").get("info");
  const usingApplicationCard = state.get("settings").get("usingApplicationCard");
  return {
    clusterInfo,
    httpRoutes,
    componentsMap,
    usingApplicationCard,
  };
};

interface Props extends WithStyles<typeof styles>, WithNamespaceProps, ReturnType<typeof mapStateToProps> {}

class ApplicationListRaw extends React.PureComponent<Props> {
  private confirmDelete = async (applicationDetails: ApplicationDetails) => {
    const { dispatch } = this.props;
    try {
      await dispatch(deleteApplicationAction(applicationDetails.get("name")));
      await dispatch(setSuccessNotificationAction("Successfully delete an application"));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderCPU = (applicationListItem: ApplicationDetails) => {
    const metrics = applicationListItem.get("metrics");
    return (
      <SmallCPULineChart data={metrics.get("cpu")} hoverText={this.hasPods(applicationListItem) ? "" : "No data"} />
    );
  };

  private renderMemory = (applicationListItem: ApplicationDetails) => {
    const metrics = applicationListItem.get("metrics");
    return (
      <SmallMemoryLineChart
        data={metrics.get("memory")}
        hoverText={this.hasPods(applicationListItem) ? "" : "No data"}
      />
    );
  };

  private renderName = (applicationDetails: ApplicationDetails) => {
    return (
      <KLink to={`/applications/${applicationDetails.get("name")}/components`} onClick={() => blinkTopProgressAction()}>
        {applicationDetails.get("name")}
      </KLink>
    );
  };

  private renderCreatedAt = (applicationDetails: ApplicationDetails) => {
    const { componentsMap } = this.props;
    const components = componentsMap.get(applicationDetails.get("name"));

    return <Caption>{components ? getApplicationCreatedAtString(components) : "-"}</Caption>;
  };

  private hasPods = (applicationDetails: ApplicationDetails) => {
    const { componentsMap } = this.props;
    let count = 0;
    componentsMap.get(applicationDetails.get("name"))?.forEach((component) => {
      component.get("pods").forEach((podStatus) => {
        count++;
      });
    });

    return count !== 0;
  };

  private renderStatus = (applicationDetails: ApplicationDetails) => {
    const { componentsMap } = this.props;

    let podCount = 0;
    let successCount = 0;
    let pendingCount = 0;
    let errorCount = 0;
    componentsMap.get(applicationDetails.get("name"))?.forEach((component) => {
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
      return "no pods";
    }

    const tooltipTitle = `Total ${podCount} pods are found. \n${successCount} ready, ${pendingCount} pending, ${errorCount} failed. Click to view details.`;

    return (
      <KLink
        to={`/applications/${applicationDetails.get("name")}/components`}
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
      </KLink>
    );
  };

  private getRoutes = (applicationName: string) => {
    const { httpRoutes } = this.props;
    const applicationRoutes = httpRoutes.filter((x) => {
      let isCurrent = false;
      x.get("destinations").map((target) => {
        const hostInfos = target.get("host").split(".");
        if (hostInfos[1].startsWith(applicationName)) {
          isCurrent = true;
        }
        return target;
      });
      return isCurrent;
    });
    return applicationRoutes;
  };

  private renderExternalAccesses = (applicationDetails: ApplicationDetails) => {
    const applicationName = applicationDetails.get("name");
    const applicationRoutes = this.getRoutes(applicationName);

    if (applicationRoutes && applicationRoutes.size > 0) {
      return (
        <PopupState variant="popover" popupId={applicationName}>
          {(popupState) => (
            <>
              <KMLink component="button" variant="body2" color={"inherit"} {...bindTrigger(popupState)}>
                {pluralize("route", applicationRoutes.size)}
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
                  <RouteWidgets routes={applicationRoutes} />
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

  private renderActions = (applicationDetails: ApplicationDetails) => {
    return (
      <>
        <IconLinkWithToolTip
          onClick={() => {
            blinkTopProgressAction();
          }}
          // size="small"
          tooltipTitle="Details"
          to={`/applications/${applicationDetails.get("name")}/components`}
        >
          <KalmDetailsIcon />
        </IconLinkWithToolTip>
        <DeleteButtonWithConfirmPopover
          popupId="delete-application-popup"
          popupTitle="DELETE APPLICATION?"
          confirmedAction={() => this.confirmDelete(applicationDetails)}
        />
      </>
    );
  };

  private renderSecondHeaderRight() {
    const { usingApplicationCard, dispatch } = this.props;
    return (
      <>
        {/* <H6>Applications</H6> */}
        <Button
          tutorial-anchor-id="add-application"
          component={Link}
          color="primary"
          size="small"
          variant="outlined"
          to={`/applications/new`}
        >
          {sc.NEW_APP_BUTTON}
        </Button>
        <IconButtonWithTooltip
          tooltipTitle={usingApplicationCard ? "Using List View" : "Using Card View"}
          aria-label={usingApplicationCard ? "Using List View" : "Using Card View"}
          onClick={() =>
            dispatch(
              setSettingsAction({
                usingApplicationCard: !usingApplicationCard,
              }),
            )
          }
          style={{ marginLeft: 12 }}
        >
          {usingApplicationCard ? <KalmGridViewIcon /> : <KalmListViewIcon />}
        </IconButtonWithTooltip>
      </>
    );
  }

  private renderEmpty() {
    const { dispatch } = this.props;

    return (
      <EmptyInfoBox
        image={<KalmApplicationIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={sc.EMPTY_APP_TITLE}
        content={sc.EMPTY_APP_SUBTITLE}
        button={
          <CustomizedButton
            variant="contained"
            color="primary"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(push(`/applications/new`));
            }}
          >
            {sc.NEW_APP_BUTTON}
          </CustomizedButton>
        }
      />
    );
  }

  private getKRTableColumns() {
    return [
      {
        Header: "Name",
        accessor: "name",
      },
      { Header: "Pod Status", accessor: "status" },
      {
        Header: "CPU",
        accessor: "cpu",
      },
      {
        Header: "Memory",
        accessor: "memory",
      },
      {
        Header: "Created At",
        accessor: "createdAt",
      },
      {
        Header: "Routes",
        accessor: "routes",
      },
      {
        Header: "Actions",
        accessor: "actions",
      },
    ];
  }

  private getKRTableData() {
    const { applications } = this.props;
    const data: any[] = [];

    applications &&
      applications.forEach((application, index) => {
        const applicationDetails = application as ApplicationDetails;
        data.push({
          name: this.renderName(applicationDetails),
          status: this.renderStatus(applicationDetails),
          cpu: this.renderCPU(applicationDetails),
          memory: this.renderMemory(applicationDetails),
          createdAt: this.renderCreatedAt(applicationDetails),
          routes: this.renderExternalAccesses(applicationDetails),
          actions: this.renderActions(applicationDetails),
        });
      });

    return data;
  }

  private renderKRTable() {
    return <KRTable showTitle={true} title="Apps" columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
  }

  private renderGrid = () => {
    const { applications, componentsMap } = this.props;

    const GridRow = (app: ApplicationDetails, index: number) => {
      const applicationName = app.get("name");
      const applicationRoutes = this.getRoutes(applicationName);
      return (
        <Grid key={index} item sm={6} md={4} lg={3}>
          <ApplicationCard
            application={app}
            componentsMap={componentsMap}
            httpRoutes={applicationRoutes}
            confirmDelete={this.confirmDelete}
          />
        </Grid>
      );
    };

    return (
      <Grid container spacing={2}>
        {applications.map((app, index) => {
          return GridRow(app, index);
        })}
      </Grid>
    );
  };

  public render() {
    const { isNamespaceLoading, isNamespaceFirstLoaded, applications, usingApplicationCard } = this.props;
    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
        <Box p={2}>
          {isNamespaceLoading && !isNamespaceFirstLoaded ? (
            <Loading />
          ) : applications.size === 0 ? (
            this.renderEmpty()
          ) : usingApplicationCard ? (
            this.renderGrid()
          ) : (
            this.renderKRTable()
          )}
        </Box>
      </BasePage>
    );
  }
}

export const ApplicationListPage = withStyles(styles)(withNamespace(connect(mapStateToProps)(ApplicationListRaw)));
