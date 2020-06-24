import {
  Box,
  Button,
  createStyles,
  Divider,
  Link as MLink,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Popover,
  Theme,
  Tooltip,
  WithStyles,
} from "@material-ui/core";
import { loadRoutes } from "actions/routes";
import { push } from "connected-react-router";
import Immutable from "immutable";
import MaterialTable, { MTableBodyRow } from "material-table";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
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
import { ApplicationDetails } from "types/application";
import { HttpRoute } from "types/route";
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
import { isPrivateIP } from "utils/ip";
import { KTable } from "widgets/Table";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";

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

  public componentDidMount() {
    const { dispatch } = this.props;
    dispatch(loadRoutes(""));
  }

  private showDeleteConfirmDialog = (deletingApplicationListItem: ApplicationDetails) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingApplicationListItem,
    });
  };

  private closeDeleteConfirmDialog = () => {
    this.setState(this.defaultState);
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen, deletingApplicationListItem } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title={`Are you sure to delete this Application(${deletingApplicationListItem?.get("name")})?`}
        content="This application is already disabled. You will lost this application config, and this action is irrevocable."
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

  private renderCreatedTime = (applicationDetails: RowData) => {
    let createdAt = new Date(0);

    applicationDetails.get("components")?.forEach((component) => {
      component.get("pods").forEach((podStatus) => {
        const ts = podStatus.get("createTimestamp");
        const tsDate = new Date(ts);
        if (createdAt <= new Date(0)) {
          createdAt = tsDate;
        } else {
          createdAt = createdAt < tsDate ? createdAt : tsDate;
        }
      });
    });
    const createdAtString = createdAt <= new Date(0) ? "-" : formatDate(createdAt);
    return <Body>{createdAtString}</Body>;
  };

  private renderStatus = (applicationDetails: RowData) => {
    let podCount = 0;
    let successCount = 0;
    let pendingCount = 0;
    let errorCount = 0;
    applicationDetails.get("components")?.forEach((component) => {
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

    const tooltipTitle = `Total ${podCount} pods are found. \n${successCount} ready, ${pendingCount} pending, ${errorCount} failed. Click to view details.`;

    return (
      <Link
        to={`/applications/${applicationDetails.get("name")}`}
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

  private buildCurlCommand = (scheme: string, host: string, path: string, method: string) => {
    const { clusterInfo } = this.props;
    let extraArgs: string[] = [];

    // test env
    if (isPrivateIP(clusterInfo.get("ingressIP"))) {
      if (scheme === "https") {
        if (!host.includes(":")) {
          host = host + ":" + clusterInfo.get("httpsPort");
        }
        extraArgs.push(`-k`);
      } else {
        if (!host.includes(":")) {
          extraArgs.push(`-H "Host: ${host}"`);
          host = host + ":" + clusterInfo.get("httpPort");
        }
      }
      extraArgs.push(`--resolve ${host}:${clusterInfo.get("ingressIP")}`);
    }

    const url = `${scheme}://${host}${path}`;

    return `curl -v -X ${method}${extraArgs.map((x) => " " + x).join("")} ${url}`;
  };

  private renderExternalAccesses = (applicationDetails: RowData) => {
    const { routesMap, clusterInfo, activeNamespaceName, dispatch } = this.props;

    const applicationRoutes: Immutable.List<HttpRoute> | undefined = routesMap.get(applicationDetails.get("name"));
    if (applicationRoutes && applicationRoutes.size > 0) {
      return (
        <PopupState variant="popover" popupId={applicationDetails.get("name")}>
          {(popupState) => (
            <>
              <MLink component="button" variant="body2" {...bindTrigger(popupState)}>
                {applicationRoutes.size === 1 ? "1 route" : `${applicationRoutes.size} routes`}
              </MLink>
              <Popover
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
                {applicationRoutes
                  .map((route, index) => {
                    let items: React.ReactNode[] = [];
                    route.get("schemes").forEach((scheme) => {
                      // route.get("hosts").forEach(host => {
                      // route.get("paths").forEach(path => {
                      let host = route.get("hosts").first("*");
                      const path = route.get("paths").first("/");

                      if (host === "*") {
                        host =
                          (clusterInfo.get("ingressIP") || clusterInfo.get("ingressHostname")) +
                          ":" +
                          clusterInfo.get(scheme === "https" ? "httpsPort" : "httpPort");
                      }

                      if (host.includes("*")) {
                        host = host.replace("*", "wildcard");
                      }

                      const url = scheme + "://" + host + path;

                      items.push(
                        <ListItem>
                          <ListItemText primary={url} />
                          <Box ml={2}>
                            <Button
                              variant="text"
                              size="small"
                              color="primary"
                              href={url}
                              target="_blank"
                              rel="noreferer"
                              disabled={!route.get("methods").includes("GET")}
                            >
                              Open
                            </Button>
                          </Box>
                          <Box ml={1}>
                            <Button
                              variant="text"
                              size="small"
                              color="primary"
                              onClick={() => {
                                navigator.clipboard
                                  .writeText(
                                    this.buildCurlCommand(scheme, host, path, route.get("methods").first("GET")),
                                  )
                                  .then(
                                    function () {
                                      dispatch(setSuccessNotificationAction("Copied successful!"));
                                    },
                                    function (err) {
                                      dispatch(setErrorNotificationAction("Copied failed!"));
                                    },
                                  );
                              }}
                            >
                              Copy as curl
                            </Button>
                          </Box>
                        </ListItem>,
                      );
                    });

                    const targetDetails = route
                      .get("destinations")
                      .map((destination) =>
                        destination
                          .get("host")
                          .replace(".svc.cluster.local", "")
                          .replace(`.${activeNamespaceName}`, ""),
                      )
                      .join(", ");

                    return (
                      <>
                        <List
                          component="nav"
                          dense
                          subheader={
                            <ListSubheader component="div" id="nested-list-subheader">
                              #{index} (
                              {route.get("methods").size === 9 ? "ALL methods" : route.get("methods").join(",")}) (
                              {targetDetails})
                            </ListSubheader>
                          }
                        >
                          {items}
                        </List>
                        {index < applicationRoutes.size - 1 ? <Divider /> : null}
                      </>
                    );
                  })
                  .toArray()}
              </Popover>
            </>
          )}
        </PopupState>
      );
    } else {
      // return <Link to={applicationRouteUrl(applicationDetails.get("name"))}>Add route</Link>;
      return "-";
    }
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
    const { classes, dispatch } = this.props;
    return (
      <div className={classes.secondHeaderRight}>
        <H4 className={classes.secondHeaderRightItem}>Applications</H4>
        <CustomizedButton
          tutorial-anchor-id="add-application"
          color="primary"
          size="large"
          className={classes.secondHeaderRightItem}
          onClick={() => {
            blinkTopProgressAction();
            dispatch(push(`/applications/new`));
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
        // hidden: !hasWriterRole,
      },
      {
        title: "Routes",
        sorting: false,
        render: this.renderExternalAccesses,
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

  private renderEmpty() {
    const { dispatch, classes } = this.props;

    return (
      <div className={classes.emptyWrapper}>
        <CustomizedButton
          variant="contained"
          color="primary"
          onClick={() => {
            blinkTopProgressAction();
            dispatch(push(`/applications/new`));
          }}
        >
          Create your first application
        </CustomizedButton>
      </div>
    );
  }

  public render() {
    const { isNamespaceLoading, isNamespaceFirstLoaded, applications } = this.props;

    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
        {this.renderDeleteConfirmDialog()}
        <Box p={2}>
          {isNamespaceLoading && !isNamespaceFirstLoaded ? (
            <Loading />
          ) : applications.size === 0 ? (
            this.renderEmpty()
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

export const ApplicationListPage = withStyles(styles)(withNamespace(connect(mapStateToProps)(ApplicationListRaw)));
