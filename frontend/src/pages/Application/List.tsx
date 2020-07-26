import { Box, Button, createStyles, Link as MLink, Popover, Theme, Tooltip, WithStyles, Grid } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import withStyles from "@material-ui/core/styles/withStyles";
import { deleteApplicationAction } from "actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction, setSettingsAction } from "actions/settings";
import { push } from "connected-react-router";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import Immutable from "immutable";
import { POPPER_ZINDEX } from "layout/Constants";
import MaterialTable, { MTableBodyRow } from "material-table";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
import { RouteWidgets } from "pages/Route/Widget";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { primaryColor } from "theme/theme";
import { ApplicationDetails } from "types/application";
import { HttpRoute } from "types/route";
import { getApplicationCreatedAtString } from "utils/application";
import { customSearchForImmutable } from "utils/tableSearch";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CustomizedButton } from "widgets/Button";
import { ConfirmDialog } from "widgets/ConfirmDialog";
import { EmptyList } from "widgets/EmptyList";
import { FoldButtonGroup } from "widgets/FoldButtonGroup";
import { DeleteIcon, KalmApplicationIcon, KalmDetailsIcon, KalmGridViewIcon, KalmListViewIcon } from "widgets/Icon";
import { Body } from "widgets/Label";
import { Loading } from "widgets/Loading";
import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
import { KTable } from "widgets/Table";
import { BasePage } from "../BasePage";
import { ApplicationCard } from "widgets/ApplicationCard";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { pluralize } from "utils/string";

const externalEndpointsModalID = "externalEndpointsModalID";
const internalEndpointsModalID = "internalEndpointsModalID";

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
  const internalEndpointsDialog = state.get("dialogs").get(internalEndpointsModalID);
  const externalEndpointsDialog = state.get("dialogs").get(externalEndpointsModalID);
  const routesMap = state.get("routes").get("httpRoutes");
  const componentsMap = state.get("components").get("components");
  const clusterInfo = state.get("cluster").get("info");
  const usingApplicationCard = state.get("settings").get("usingApplicationCard");
  return {
    clusterInfo,
    internalEndpointsDialogData: internalEndpointsDialog ? internalEndpointsDialog.get("data") : {},
    externalEndpointsDialogData: externalEndpointsDialog ? externalEndpointsDialog.get("data") : {},
    routesMap,
    componentsMap,
    usingApplicationCard,
  };
};

interface Props extends WithStyles<typeof styles>, WithNamespaceProps, ReturnType<typeof mapStateToProps> {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  deletingApplicationListItem?: ApplicationDetails;
}

interface RowData extends ApplicationDetails {
  index: number;
}

class ApplicationListRaw extends React.PureComponent<Props, State> {
  private tableRef: React.RefObject<MaterialTable<ApplicationDetails>> = React.createRef();

  private defaultState = {
    isDeleteConfirmDialogOpen: false,
    deletingApplicationListItem: undefined,
  };

  constructor(props: Props) {
    super(props);
    this.state = this.defaultState;
  }

  private showDeleteConfirmDialog = (deletingApplicationListItem: ApplicationDetails) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingApplicationListItem,
    });
  };

  private closeDeleteConfirmDialog = () => {
    this.setState({ isDeleteConfirmDialogOpen: false });
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen, deletingApplicationListItem } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title={`Are you sure to delete this Application(${deletingApplicationListItem?.get("name")})?`}
        content="You will lost this application, and this action is irrevocable."
        onAgree={this.confirmDelete}
      />
    );
  };

  private confirmDelete = async () => {
    const { dispatch } = this.props;
    try {
      const { deletingApplicationListItem } = this.state;
      if (deletingApplicationListItem) {
        await dispatch(deleteApplicationAction(deletingApplicationListItem.get("name")));
        await dispatch(setSuccessNotificationAction("Successfully delete an application"));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderCPU = (applicationListItem: RowData) => {
    const metrics = applicationListItem.get("metrics");
    return (
      <SmallCPULineChart data={metrics.get("cpu")} hoverText={this.hasPods(applicationListItem) ? "" : "No data"} />
    );
  };

  private renderMemory = (applicationListItem: RowData) => {
    const metrics = applicationListItem.get("metrics");
    return (
      <SmallMemoryLineChart
        data={metrics.get("memory")}
        hoverText={this.hasPods(applicationListItem) ? "" : "No data"}
      />
    );
  };

  private renderName = (rowData: RowData) => {
    return (
      <Link
        style={{ color: primaryColor }}
        to={`/applications/${rowData.get("name")}/components`}
        onClick={() => blinkTopProgressAction()}
      >
        {rowData.get("name")}
      </Link>
    );
  };

  private renderCreatedAt = (applicationDetails: RowData) => {
    const { componentsMap } = this.props;
    const components = componentsMap.get(applicationDetails.get("name"));

    return <Body>{components ? getApplicationCreatedAtString(components) : "-"}</Body>;
  };

  private hasPods = (applicationDetails: RowData) => {
    const { componentsMap } = this.props;
    let count = 0;
    componentsMap.get(applicationDetails.get("name"))?.forEach((component) => {
      component.get("pods").forEach((podStatus) => {
        count++;
      });
    });

    return count !== 0;
  };

  private renderStatus = (applicationDetails: RowData) => {
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
      return "No Pods";
    }

    const tooltipTitle = `Total ${podCount} pods are found. \n${successCount} ready, ${pendingCount} pending, ${errorCount} failed. Click to view details.`;

    return (
      <Link
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
      </Link>
    );
  };

  private renderExternalAccesses = (applicationDetails: RowData) => {
    const { routesMap, activeNamespaceName } = this.props;

    const applicationRoutes: Immutable.List<HttpRoute> = routesMap.get(
      applicationDetails.get("name"),
      Immutable.List(),
    );

    if (applicationRoutes && applicationRoutes.size > 0) {
      return (
        <PopupState variant="popover" popupId={applicationDetails.get("name")}>
          {(popupState) => (
            <>
              <MLink component="button" variant="body2" {...bindTrigger(popupState)}>
                {pluralize("route", applicationRoutes.size)}
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

  private renderMoreActions = (rowData: RowData) => {
    let options = [
      {
        text: "Details",
        to: `/applications/${rowData.get("name")}/components`,
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
          this.showDeleteConfirmDialog(rowData);
        },
        icon: <DeleteIcon />,
        requiredRole: "writer",
      },
    ];
    return <FoldButtonGroup options={options} />;
  };

  private getData = () => {
    const { applications } = this.props;
    const data: RowData[] = [];

    applications.forEach((application, index) => {
      const rowData = application as RowData;
      rowData.index = index;
      data.push(rowData);
    });

    return data;
  };

  private renderSecondHeaderRight() {
    const { usingApplicationCard, dispatch } = this.props;
    return (
      <>
        {/* <H4>Applications</H4> */}
        <Button
          tutorial-anchor-id="add-application"
          component={Link}
          color="primary"
          size="small"
          variant="outlined"
          to={`/applications/new`}
        >
          Create New App
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

  private getColumns() {
    const columns = [
      // @ts-ignore
      {
        title: "Name",
        field: "name",
        sorting: false,
        render: this.renderName,
        customFilterAndSearch: customSearchForImmutable,
      },
      { title: "Pods Status", field: "status", sorting: false, render: this.renderStatus },
      {
        title: "CPU",
        field: "cpu",
        render: this.renderCPU,
        sorting: false,
        headerStyle: {
          textAlign: "center",
        },
      },
      {
        title: "Memory",
        field: "memory",
        render: this.renderMemory,
        sorting: false,
        headerStyle: {
          textAlign: "center",
        },
      },
      {
        title: "Created At",
        field: "active",
        sorting: false,
        render: this.renderCreatedAt,
        // hidden: !hasWriterRole,
      },
      {
        title: "Routes",
        sorting: false,
        render: this.renderExternalAccesses,
      },
      {
        title: "Actions",
        field: "moreAction",
        sorting: false,
        searchable: false,
        render: this.renderMoreActions,
      },
    ];

    return columns;
  }

  private renderEmpty() {
    const { dispatch } = this.props;

    return (
      <EmptyList
        image={<KalmApplicationIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={"To get started, create your first Application"}
        content="In Kalm, Applications are the basis of how you organize stuff. One Application represents a set of micro-services which works together to provide functionality. For example, you could use an Application a “website”, which is made of multiple components: web-server, an api-server, and an auth-server."
        button={
          <CustomizedButton
            variant="contained"
            color="primary"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(push(`/applications/new`));
            }}
          >
            Create Application
          </CustomizedButton>
        }
      />
    );
  }

  private renderList = () => {
    const { applications } = this.props;
    return (
      <KTable
        tableRef={this.tableRef}
        options={{
          paging: applications.size > 20,
        }}
        components={{
          Row: (props: any) => (
            // <ApplicationCard application={props.data} />

            <MTableBodyRow tutorial-anchor-id={"applications-list-item-" + props.data.get("name")} {...props} />
          ),
        }}
        // @ts-ignore
        columns={this.getColumns()}
        data={this.getData()}
        title=""
      />
    );
  };

  private renderGrid = () => {
    const { applications, componentsMap, routesMap, activeNamespaceName } = this.props;
    const GridRow = (app: ApplicationDetails, index: number) => {
      return (
        <Grid key={index} item sm={6} md={4} lg={3}>
          <ApplicationCard
            application={app}
            componentsMap={componentsMap}
            routesMap={routesMap}
            activeNamespaceName={activeNamespaceName}
            showDeleteConfirmDialog={this.showDeleteConfirmDialog}
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
        {this.renderDeleteConfirmDialog()}
        <Box p={2}>
          {isNamespaceLoading && !isNamespaceFirstLoaded ? (
            <Loading />
          ) : applications.size === 0 ? (
            this.renderEmpty()
          ) : usingApplicationCard ? (
            this.renderGrid()
          ) : (
            this.renderList()
          )}
        </Box>
      </BasePage>
    );
  }
}

export const ApplicationListPage = withStyles(styles)(withNamespace(connect(mapStateToProps)(ApplicationListRaw)));
