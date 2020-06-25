import { Box, createStyles, Theme, Tooltip, WithStyles } from "@material-ui/core";
import { loadRoutes } from "actions/routes";
import { push } from "connected-react-router";
import MaterialTable, { MTableBodyRow } from "material-table";
import React from "react";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CustomizedButton } from "widgets/Button";
import { KappConsoleIcon, KappLogIcon } from "widgets/Icon";
import { deleteApplicationAction } from "actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { primaryColor } from "theme";
import { ApplicationComponentDetails, ApplicationDetails } from "types/application";
import { formatDate } from "utils";
import { customSearchForImmutable } from "utils/tableSearch";
import { ConfirmDialog } from "widgets/ConfirmDialog";
import { FoldButtonGroup } from "widgets/FoldButtonGroup";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { Body, H4 } from "widgets/Label";
import { Loading } from "widgets/Loading";
import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
import { BasePage } from "../BasePage";
import withStyles from "@material-ui/core/styles/withStyles";
import { connect } from "react-redux";
import { KTable } from "widgets/Table";
import { withComponents, WithComponentsProps } from "hoc/withComponents";
import { Namespaces } from "widgets/Namespaces";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";

const externalEndpointsModalID = "externalEndpointsModalID";
const internalEndpointsModalID = "internalEndpointsModalID";

const styles = (theme: Theme) =>
  createStyles({
    secondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
    },
    secondHeaderRightItem: {
      marginLeft: 20,
    },
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
  const clusterInfo = state.get("cluster").get("info");
  return {
    clusterInfo,
    internalEndpointsDialogData: internalEndpointsDialog ? internalEndpointsDialog.get("data") : {},
    externalEndpointsDialogData: externalEndpointsDialog ? externalEndpointsDialog.get("data") : {},
    routesMap,
  };
};

interface Props extends WithStyles<typeof styles>, WithComponentsProps, ReturnType<typeof mapStateToProps> {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  deletingComponentItem?: ApplicationDetails;
}

interface RowData extends ApplicationComponentDetails {
  index: number;
}

class ComponentRaw extends React.PureComponent<Props, State> {
  private tableRef: React.RefObject<MaterialTable<ApplicationDetails>> = React.createRef();

  private defaultState = {
    isDeleteConfirmDialogOpen: false,
    deletingComponentItem: undefined,
  };

  constructor(props: Props) {
    super(props);
    this.state = this.defaultState;
  }

  public componentDidMount() {
    const { dispatch } = this.props;
    dispatch(loadRoutes(""));
  }

  private showDeleteConfirmDialog = (deletingComponentItem: ApplicationDetails) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingComponentItem,
    });
  };

  private closeDeleteConfirmDialog = () => {
    this.setState(this.defaultState);
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen, deletingComponentItem } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title={`Are you sure to delete this Application(${deletingComponentItem?.get("name")})?`}
        content="This application is already disabled. You will lost this application config, and this action is irrevocable."
        onAgree={this.confirmDelete}
      />
    );
  };

  private confirmDelete = async () => {
    const { dispatch } = this.props;
    try {
      const { deletingComponentItem } = this.state;
      if (deletingComponentItem) {
        await dispatch(deleteApplicationAction(deletingComponentItem.get("name")));
        await dispatch(setSuccessNotificationAction("Successfully delete an application"));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderCPU = (applicationListItem: RowData) => {
    const cpuData = applicationListItem.get("metrics").get("cpu");
    return <SmallCPULineChart data={cpuData} />;
  };
  private renderMemory = (applicationListItem: RowData) => {
    const memoryData = applicationListItem.get("metrics").get("memory");
    return <SmallMemoryLineChart data={memoryData} />;
  };

  private renderName = (rowData: RowData) => {
    return (
      <Link
        style={{ color: primaryColor }}
        to={`/applications/${rowData.get("name")}`}
        onClick={() => blinkTopProgressAction()}
      >
        {rowData.get("name")}
      </Link>
    );
  };

  private renderCreatedTime = (component: RowData) => {
    let createdAt = new Date(0);

    component.get("pods").forEach((podStatus) => {
      const ts = podStatus.get("createTimestamp");
      const tsDate = new Date(ts);
      if (createdAt <= new Date(0)) {
        createdAt = tsDate;
      } else {
        createdAt = createdAt < tsDate ? createdAt : tsDate;
      }
    });

    const createdAtString = createdAt <= new Date(0) ? "-" : formatDate(createdAt);
    return <Body>{createdAtString}</Body>;
  };

  private renderStatus = (component: RowData) => {
    let podCount = 0;
    let successCount = 0;
    let pendingCount = 0;
    let errorCount = 0;

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

    const tooltipTitle = `Total ${podCount} pods are found. \n${successCount} ready, ${pendingCount} pending, ${errorCount} failed. Click to view details.`;

    return (
      <Link
        to={`/applications/${component.get("name")}`}
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

  private renderActions = (rowData: RowData) => {
    return (
      <>
        <IconButtonWithTooltip
          onClick={() => blinkTopProgressAction()}
          tooltipTitle="Shell"
          style={{ color: primaryColor }}
          component={Link}
          size={"small"}
          to={`/applications/${rowData.get("name")}/shells`}
        >
          <KappConsoleIcon />
        </IconButtonWithTooltip>
        <IconButtonWithTooltip
          onClick={() => blinkTopProgressAction()}
          tooltipTitle="Logs"
          style={{ color: primaryColor }}
          component={Link}
          size={"small"}
          to={`/applications/${rowData.get("name")}/logs`}
        >
          <KappLogIcon />
        </IconButtonWithTooltip>
      </>
    );
  };

  private renderMoreActions = (rowData: RowData) => {
    let options = [
      {
        text: "Details",
        to: `/applications/${rowData.get("name")}`,
        iconName: "fullscreen",
      },
      {
        text: "Edit",
        to: `/applications/${rowData.get("name")}/edit`,
        iconName: "edit",
        requiredRole: "writer",
      },
      {
        text: "Delete",
        onClick: () => {
          this.showDeleteConfirmDialog(rowData);
        },
        iconName: "delete",
        requiredRole: "writer",
      },
    ];
    return <FoldButtonGroup options={options} />;
  };

  private getData = () => {
    const { components } = this.props;
    const data: RowData[] = [];

    components.forEach((component, index) => {
      const rowData = component as RowData;
      rowData.index = index;
      data.push(rowData);
    });

    return data;
  };

  private renderSecondHeaderRight() {
    const { classes, dispatch, activeNamespaceName } = this.props;

    return (
      <div className={classes.secondHeaderRight}>
        <H4 className={classes.secondHeaderRightItem}>Components</H4>
        <CustomizedButton
          tutorial-anchor-id="add-component"
          color="primary"
          size="large"
          className={classes.secondHeaderRightItem}
          onClick={() => {
            blinkTopProgressAction();
            dispatch(push(`/applications/${activeNamespaceName}/components/new`));
          }}
        >
          Add
        </CustomizedButton>
      </div>
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
        title: "Created On",
        field: "active",
        sorting: false,
        render: this.renderCreatedTime,
      },
      {
        title: "Actions",
        field: "action",
        sorting: false,
        searchable: false,
        render: this.renderActions,
      },
      {
        title: "",
        field: "moreAction",
        sorting: false,
        searchable: false,
        render: this.renderMoreActions,
      },
    ];

    return columns;
  }

  public render() {
    const { isNamespaceLoading, isNamespaceFirstLoaded, applications } = this.props;

    return (
      <BasePage
        secondHeaderRight={this.renderSecondHeaderRight()}
        secondHeaderLeft={<Namespaces />}
        leftDrawer={<ApplicationSidebar />}
      >
        {this.renderDeleteConfirmDialog()}
        <Box p={2}>
          {isNamespaceLoading && !isNamespaceFirstLoaded ? (
            <Loading />
          ) : (
            <KTable
              tableRef={this.tableRef}
              options={{
                paging: applications.size > 20,
              }}
              components={{
                Row: (props: any) => (
                  <MTableBodyRow tutorial-anchor-id={"applications-list-item-" + props.data.get("name")} {...props} />
                ),
              }}
              // @ts-ignore
              columns={this.getColumns()}
              data={this.getData()}
              title=""
            />
          )}
        </Box>
      </BasePage>
    );
  }
}

export const ComponentListPage = withStyles(styles)(withComponents(connect(mapStateToProps)(ComponentRaw)));
