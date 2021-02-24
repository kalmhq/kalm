import { Box, Button, createStyles, Grid, Theme, Tooltip, WithStyles } from "@material-ui/core";
import { blue } from "@material-ui/core/colors";
import withStyles from "@material-ui/core/styles/withStyles";
import { deleteApplicationAction } from "actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { push } from "connected-react-router";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { primaryColor } from "theme/theme";
import { ApplicationDetails } from "types/application";
import { getApplicationCreatedAtString } from "utils/application";
import sc from "utils/stringConstants";
import { ApplicationCard } from "widgets/ApplicationCard";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { KalmApplicationIcon, KalmDetailsIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { KRTable } from "widgets/KRTable";
import { Caption } from "widgets/Label";
import { KLink } from "widgets/Link";
import { Loading } from "widgets/Loading";
import { RoutesPopover } from "widgets/RoutesPopover";
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
  const httpRoutes = state.routes.httpRoutes;
  const componentsMap = state.components.components;
  const clusterInfo = state.cluster.info;
  const usingApplicationCard = state.settings.usingApplicationCard;
  return {
    clusterInfo,
    httpRoutes,
    componentsMap,
    usingApplicationCard,
  };
};

interface Props
  extends WithStyles<typeof styles>,
    WithNamespaceProps,
    WithUserAuthProps,
    ReturnType<typeof mapStateToProps> {}

const ApplicationListRaw: React.FC<Props> = (props) => {
  const confirmDelete = async (applicationDetails: ApplicationDetails) => {
    const { dispatch } = props;
    try {
      await dispatch(deleteApplicationAction(applicationDetails.name));
      await dispatch(setSuccessNotificationAction("Successfully delete an application"));
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  const renderCPU = (applicationListItem: ApplicationDetails) => {
    const metrics = applicationListItem.metrics;
    return (
      <SmallCPULineChart data={metrics && metrics.cpu} hoverText={hasPods(applicationListItem) ? "" : "No data"} />
    );
  };

  const renderMemory = (applicationListItem: ApplicationDetails) => {
    const metrics = applicationListItem.metrics;
    return (
      <SmallMemoryLineChart
        data={metrics && metrics.memory}
        hoverText={hasPods(applicationListItem) ? "" : "No data"}
      />
    );
  };

  const renderName = (applicationDetails: ApplicationDetails) => {
    const { canViewNamespace } = props;

    return (
      <>
        {canViewNamespace(applicationDetails.name) ? (
          <KLink to={`/applications/${applicationDetails.name}/components`} onClick={() => blinkTopProgressAction()}>
            {applicationDetails.name}
          </KLink>
        ) : (
          applicationDetails.name
        )}
      </>
    );
  };

  const renderCreatedAt = (applicationDetails: ApplicationDetails) => {
    const { componentsMap } = props;
    const components = componentsMap[applicationDetails.name];

    return <Caption>{components ? getApplicationCreatedAtString(components) : "-"}</Caption>;
  };

  const hasPods = (applicationDetails: ApplicationDetails) => {
    const { componentsMap } = props;
    let count = 0;
    componentsMap[applicationDetails.name]?.forEach((component) => {
      component.pods?.forEach((podStatus) => {
        count++;
      });
    });

    return count !== 0;
  };

  const renderStatus = (applicationDetails: ApplicationDetails) => {
    const { componentsMap, canViewNamespace } = props;
    const applicationName = applicationDetails.name;

    let podCount = 0;
    let successCount = 0;
    let pendingCount = 0;
    let errorCount = 0;
    componentsMap[applicationDetails.name]?.forEach((component) => {
      component.pods?.forEach((podStatus) => {
        podCount++;
        switch (podStatus.status) {
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

    if (!canViewNamespace(applicationName) || podCount === 0) {
      return "no pods";
    }

    const tooltipTitle = `Total ${podCount} pods are found. \n${successCount} ready, ${pendingCount} pending, ${errorCount} failed. Click to view details.`;

    return (
      <KLink
        to={`/applications/${applicationDetails.name}/components`}
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

  const getRoutes = (applicationName: string) => {
    const { httpRoutes } = props;
    const applicationRoutes = httpRoutes.filter((x) => {
      let isCurrent = false;
      x.destinations.map((target) => {
        const hostInfos = target.host.split(".");
        if (hostInfos[1] && hostInfos[1].startsWith(applicationName)) {
          isCurrent = true;
        }
        return target;
      });
      return isCurrent;
    });
    return applicationRoutes;
  };

  const renderExternalAccesses = (applicationDetails: ApplicationDetails) => {
    const { canViewNamespace, canEditNamespace } = props;
    const applicationName = applicationDetails.name;
    const applicationRoutes = getRoutes(applicationName);

    if (applicationRoutes && applicationRoutes.length > 0 && canViewNamespace(applicationName)) {
      return (
        <RoutesPopover
          applicationRoutes={applicationRoutes}
          applicationName={applicationName}
          canEdit={canEditNamespace(applicationName)}
        />
      );
    } else {
      return "-";
    }
  };

  const renderActions = (applicationDetails: ApplicationDetails) => {
    const { canViewNamespace } = props;
    return (
      <>
        {canViewNamespace(applicationDetails.name) && (
          <IconLinkWithToolTip
            onClick={() => {
              blinkTopProgressAction();
            }}
            // size="small"
            tooltipTitle="Details"
            to={`/applications/${applicationDetails.name}/components`}
          >
            <KalmDetailsIcon />
          </IconLinkWithToolTip>
        )}
      </>
    );
  };

  const renderSecondHeaderRight = () => {
    const { canEditCluster } = props;
    return (
      <>
        {/* <H6>Applications</H6> */}
        {canEditCluster() && (
          <Button
            tutorial-anchor-id="add-application"
            component={Link}
            color="primary"
            size="small"
            variant="contained"
            to={`/applications/new`}
          >
            {sc.NEW_APP_BUTTON}
          </Button>
        )}
        {/* <IconButtonWithTooltip
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
        </IconButtonWithTooltip> */}
      </>
    );
  };

  const renderEmpty = () => {
    const { dispatch, canEditCluster } = props;

    return (
      <EmptyInfoBox
        image={<KalmApplicationIcon style={{ height: 120, width: 120, color: blue[200] }} />}
        title={sc.EMPTY_APP_TITLE}
        content={sc.EMPTY_APP_SUBTITLE}
        button={
          canEditCluster() && (
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
          )
        }
      />
    );
  };

  const getKRTableColumns = () => {
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
  };

  const getKRTableData = () => {
    const { applications, canViewNamespace, canEditNamespace } = props;
    const data: any[] = [];

    if (applications) {
      for (let i = 0; i < applications.length; i++) {
        const application = applications[i];

        if (application.name === "kalm-system") {
          continue;
        }

        const applicationDetails = application as ApplicationDetails;
        const applicationName = applicationDetails.name;

        if (canViewNamespace(applicationName) || canEditNamespace(applicationName)) {
          data.push({
            name: renderName(applicationDetails),
            status: renderStatus(applicationDetails),
            cpu: renderCPU(applicationDetails),
            memory: renderMemory(applicationDetails),
            createdAt: renderCreatedAt(applicationDetails),
            routes: renderExternalAccesses(applicationDetails),
            actions: renderActions(applicationDetails),
          });
        }
      }
    }

    return data;
  };

  const renderKRTable = () => {
    return <KRTable showTitle={true} title="Apps" columns={getKRTableColumns()} data={getKRTableData()} />;
  };

  const renderGrid = () => {
    const { applications, componentsMap, canEditNamespace, canViewNamespace } = props;

    const filteredApps = applications.filter((app) => {
      return canViewNamespace(app.name) || canEditNamespace(app.name);
    });

    const GridRow = (app: ApplicationDetails, index: number) => {
      const applicationRoutes = getRoutes(app.name);
      return (
        <Grid key={index} item sm={6} md={4} lg={3}>
          <ApplicationCard
            application={app}
            componentsMap={componentsMap}
            httpRoutes={applicationRoutes}
            confirmDelete={confirmDelete}
            canEdit={canEditNamespace(app.name)}
          />
        </Grid>
      );
    };

    return (
      <Grid container spacing={2}>
        {filteredApps.map((app, index) => {
          return GridRow(app, index);
        })}
      </Grid>
    );
  };

  const { isNamespaceLoading, isNamespaceFirstLoaded, applications, usingApplicationCard } = props;
  return (
    <BasePage secondHeaderRight={renderSecondHeaderRight()}>
      <Box p={2}>
        {isNamespaceLoading && !isNamespaceFirstLoaded ? (
          <Loading />
        ) : applications.length === 0 ? (
          renderEmpty()
        ) : usingApplicationCard ? (
          renderGrid()
        ) : (
          renderKRTable()
        )}
      </Box>
    </BasePage>
  );
};

export const ApplicationListPage = withStyles(styles)(
  withNamespace(withUserAuth(connect(mapStateToProps)(ApplicationListRaw))),
);
