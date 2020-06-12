import {
  Button,
  createStyles,
  TextField,
  Theme,
  Tooltip,
  WithStyles,
  withStyles,
  Popover,
  Link as MLink,
  List,
  ListItemText,
  ListItemProps,
  ListItem,
  Divider,
  Box,
  ListSubheader,
  ButtonGroup
} from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { loadClusterInfoAction } from "actions/cluster";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { loadRoutes } from "actions/routes";
import { push } from "connected-react-router";
import MaterialTable from "material-table";
import { withNamespace, withNamespaceProps } from "permission/Namespace";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { applicationRouteUrl } from "utils/route";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CustomizedButton } from "widgets/Button";
import { ControlledDialog } from "widgets/ControlledDialog";
import { KappConsoleIcon, KappLogIcon } from "widgets/Icon";
import { deleteApplicationAction, duplicateApplicationAction, loadApplicationAction } from "../../actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "../../actions/notification";
import { duplicateApplicationName, getApplicationByName } from "../../selectors/application";
import { primaryColor } from "../../theme";
import { ApplicationDetails } from "../../types/application";
import { formatDate } from "../../utils";
import { customSearchForImmutable } from "../../utils/tableSearch";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { FoldButtonGroup } from "../../widgets/FoldButtonGroup";
import { IconButtonWithTooltip } from "../../widgets/IconButtonWithTooltip";
import { Body, H4 } from "../../widgets/Label";
import { Loading } from "../../widgets/Loading";
import { SmallCPULineChart, SmallMemoryLineChart } from "../../widgets/SmallLineChart";
import { BasePage } from "../BasePage";
import { ApplicationListDataWrapper, WithApplicationsListDataProps } from "./ListDataWrapper";
import PopupState, { bindTrigger, bindPopover } from "material-ui-popup-state";
import { HttpRoute } from "types/route";

const externalEndpointsModalID = "externalEndpointsModalID";
const internalEndpointsModalID = "internalEndpointsModalID";

function ListItemLink(props: ListItemProps<"a", { button?: true }>) {
  return <ListItem button component="a" {...props} />;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3),
      "& tr.MuiTableRow-root td": {
        verticalAlign: "middle"
      }
    },
    componentWrapper: {
      minWidth: "120px"
    },
    componentLine: {
      display: "inline-block"
    },
    duplicateConfirmFileds: {
      marginTop: "20px",
      width: "100%",
      display: "flex",
      justifyContent: "space-between"
    },
    secondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center"
    },
    secondHeaderRightItem: {
      marginLeft: 20
    },
    emptyWrapper: {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      paddingTop: "110px"
    }
  });

const mapStateToProps = (state: RootState) => {
  const internalEndpointsDialog = state.get("dialogs").get(internalEndpointsModalID);
  const externalEndpointsDialog = state.get("dialogs").get(externalEndpointsModalID);
  const routes = state.get("routes").get("httpRoutes");
  const clusterInfo = state.get("cluster").get("info");
  return {
    clusterInfo,
    internalEndpointsDialogData: internalEndpointsDialog ? internalEndpointsDialog.get("data") : {},
    externalEndpointsDialogData: externalEndpointsDialog ? externalEndpointsDialog.get("data") : {},
    routes
  };
};
interface Props
  extends WithApplicationsListDataProps,
    WithStyles<typeof styles>,
    withNamespaceProps,
    ReturnType<typeof mapStateToProps> {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  deletingApplicationListItem?: ApplicationDetails;
  isDuplicateConfirmDialogOpen: boolean;
  duplicatingApplicationListItem?: ApplicationDetails;
}

interface RowData extends ApplicationDetails {
  index: number;
}

class ApplicationListRaw extends React.PureComponent<Props, State> {
  private duplicateApplicationNameRef: React.RefObject<any>;
  private duplicateApplicationNamespaceRef: React.RefObject<any>;
  private tableRef: React.RefObject<MaterialTable<ApplicationDetails>> = React.createRef();

  private defaultState = {
    isDeleteConfirmDialogOpen: false,
    deletingApplicationListItem: undefined,
    isDuplicateConfirmDialogOpen: false,
    duplicatingApplicationListItem: undefined
  };

  constructor(props: Props) {
    super(props);
    this.state = this.defaultState;

    this.duplicateApplicationNameRef = React.createRef();
    this.duplicateApplicationNamespaceRef = React.createRef();
  }

  private showDuplicateConfirmDialog = (duplicatingApplicationListItem: ApplicationDetails) => {
    this.setState({
      isDuplicateConfirmDialogOpen: true,
      duplicatingApplicationListItem
    });
  };

  public componentDidMount() {
    const { dispatch } = this.props;
    dispatch(loadRoutes(""));
    dispatch(loadClusterInfoAction());
  }

  private closeDuplicateConfirmDialog = () => {
    this.setState(this.defaultState);
  };

  private renderDuplicateConfirmDialog = () => {
    const { classes } = this.props;
    const { isDuplicateConfirmDialogOpen, duplicatingApplicationListItem } = this.state;

    let title, content;
    title = "Duplicate Application";
    content = (
      <div>
        Please confirm the namespace and name of new application.
        <div className={classes.duplicateConfirmFileds}>
          <TextField
            inputRef={this.duplicateApplicationNameRef}
            label="Name"
            size="small"
            variant="outlined"
            defaultValue={duplicateApplicationName(duplicatingApplicationListItem?.get("name") as string)}
            required
          />
        </div>
      </div>
    );

    return (
      <ConfirmDialog
        open={isDuplicateConfirmDialogOpen}
        onClose={this.closeDuplicateConfirmDialog}
        title={title}
        content={content}
        onAgree={this.confirmDuplicate}
      />
    );
  };

  private confirmDuplicate = async () => {
    const { dispatch } = this.props;
    try {
      const { duplicatingApplicationListItem } = this.state;
      if (duplicatingApplicationListItem) {
        await dispatch(loadApplicationAction(duplicatingApplicationListItem.get("name")));

        let newApplication = getApplicationByName(duplicatingApplicationListItem.get("name"));

        newApplication = newApplication.set("name", this.duplicateApplicationNameRef.current.value);

        dispatch(duplicateApplicationAction(newApplication));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private showDeleteConfirmDialog = (deletingApplicationListItem: ApplicationDetails) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingApplicationListItem
    });
  };

  private closeDeleteConfirmDialog = () => {
    this.setState(this.defaultState);
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title="Are you sure to delete this Application?"
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
      <Link style={{ color: primaryColor }} to={`/applications/${rowData.get("name")}`}>
        {rowData.get("name")}
      </Link>
    );
  };

  private renderCreatedTime = (applicationDetails: RowData) => {
    let createdAt = new Date(0);

    applicationDetails.get("components")?.forEach(component => {
      component.get("pods").forEach(podStatus => {
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
    applicationDetails.get("components")?.forEach(component => {
      component.get("pods").forEach(podStatus => {
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
      <Link to={`/applications/${applicationDetails.get("name")}`} style={{ color: primaryColor }}>
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
    if (clusterInfo.get("ingressIP").includes("192.168")) {
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

    return `curl -v -X ${method}${extraArgs.map(x => " " + x).join("")} ${url}`;
  };

  private renderExternalAccesses = (applicationDetails: RowData) => {
    const { routes, clusterInfo, activeNamespaceName, dispatch } = this.props;

    const applicationRoutes = routes.filter(x => x.get("namespace") === applicationDetails.get("name"));
    if (applicationRoutes.size > 0) {
      return (
        <PopupState variant="popover" popupId={applicationDetails.get("name")}>
          {popupState => (
            <>
              <MLink component="button" variant="body2" {...bindTrigger(popupState)}>
                {applicationRoutes.size === 1 ? "1 route" : `${applicationRoutes.size} routes`}
              </MLink>
              <Popover
                {...bindPopover(popupState)}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "center"
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "center"
                }}>
                {applicationRoutes
                  .map((route, index) => {
                    let items: React.ReactNode[] = [];
                    route.get("schemes").forEach(scheme => {
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
                              disabled={!route.get("methods").includes("GET")}>
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
                                    this.buildCurlCommand(scheme, host, path, route.get("methods").first("GET"))
                                  )
                                  .then(
                                    function() {
                                      dispatch(setSuccessNotificationAction("Copied successful!"));
                                    },
                                    function(err) {
                                      dispatch(setErrorNotificationAction("Copied failed!"));
                                    }
                                  );
                              }}>
                              Copy as curl
                            </Button>
                          </Box>
                        </ListItem>
                      );
                    });

                    const targetDetails = route
                      .get("destinations")
                      .map(destination =>
                        destination
                          .get("host")
                          .replace(".svc.cluster.local", "")
                          .replace(`.${activeNamespaceName}`, "")
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
                          }>
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

  private renderInternalEndpointsDialog = () => {
    const applicationDetails: RowData = this.props.internalEndpointsDialogData.applicationDetails;
    return (
      <ControlledDialog
        dialogID={internalEndpointsModalID}
        title="Internal Endpoints"
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm"
        }}
        actions={
          <CustomizedButton
            onClick={() => this.props.dispatch(closeDialogAction(internalEndpointsModalID))}
            color="default"
            variant="contained">
            Close
          </CustomizedButton>
        }>
        {applicationDetails
          ? applicationDetails
              .get("components")
              .map(component => {
                return component.get("services").map(serviceStatus => {
                  const dns = `${serviceStatus.get("name")}.${applicationDetails.get("name")}`;
                  return serviceStatus
                    .get("ports")
                    .map(port => {
                      const url = `${dns}:${port.get("port")}`;
                      return <div key={url}>{url}</div>;
                    })
                    .toArray();
                });
              })
              .toArray()
              .flat()
          : null}
      </ControlledDialog>
    );
  };

  private renderExternalAccessesDialog = () => {
    const applicationDetails: RowData = this.props.externalEndpointsDialogData.applicationDetails;
    return (
      <ControlledDialog
        dialogID={externalEndpointsModalID}
        title="External Endpoints"
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm"
        }}
        actions={
          <CustomizedButton
            onClick={() => this.props.dispatch(closeDialogAction(externalEndpointsModalID))}
            color="default"
            variant="contained">
            Close
          </CustomizedButton>
        }>
        {this.renderExternalAccessesDialogContent(applicationDetails)}
      </ControlledDialog>
    );
  };

  private renderExternalAccessesDialogContent = (applicationDetails: RowData) => {
    if (!applicationDetails) {
      return null;
    }

    let urls: string[] = [];
    applicationDetails.get("components")?.forEach(component => {
      const plugins = component.get("plugins");
      if (!plugins) {
        return;
      }

      // TODO
      return;

      // plugins.forEach(plugin => {
      //   if (plugin.get("type") !== EXTERNAL_ACCESS_PLUGIN_TYPE) {
      //     return;
      //   }

      //   const _plugin = plugin as ImmutableMap<ExternalAccessPlugin>;

      //   const hosts: string[] = _plugin.get("hosts") ? _plugin.get("hosts")!.toArray() : [];
      //   const paths: string[] = _plugin.get("paths") ? _plugin.get("paths")!.toArray() : ["/"];
      //   const schema = _plugin.get("enableHttps") ? "https" : "http";
      //   hosts.forEach(host => {
      //     paths.forEach(path => {
      //       const url = `${schema}://${host}${path}`;
      //       urls.push(url);
      //     });
      //   });
      // });
    });

    return urls.map(url => (
      <a href={url} key={url}>
        {url}
      </a>
    ));
  };

  private renderActions = (rowData: RowData) => {
    return (
      <>
        <IconButtonWithTooltip
          tooltipTitle="Shell"
          style={{ color: primaryColor }}
          component={Link}
          to={`/applications/${rowData.get("name")}/shells`}>
          <KappConsoleIcon />
        </IconButtonWithTooltip>
        <IconButtonWithTooltip
          tooltipTitle="Logs"
          style={{ color: primaryColor }}
          component={Link}
          to={`/applications/${rowData.get("name")}/logs`}>
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
        iconName: "fullscreen"
      },
      {
        text: "Edit",
        to: `/applications/${rowData.get("name")}/edit`,
        iconName: "edit",
        requiredRole: "writer"
      },
      // {
      //   text: "Duplicate",
      //   onClick: () => {
      //     this.showDuplicateConfirmDialog(rowData);
      //   },
      //   iconName: "file_copy",
      //   requiredRole: "writer"
      // },
      {
        text: "Delete",
        onClick: () => {
          this.showDeleteConfirmDialog(rowData);
        },
        iconName: "delete",
        requiredRole: "writer"
      }
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
          color="primary"
          size="large"
          className={classes.secondHeaderRightItem}
          onClick={() => {
            dispatch(push(`/applications/new`));
          }}>
          Add
        </CustomizedButton>
      </div>
    );
  }

  private getColumns() {
    const { hasRole } = this.props;
    const hasWriterRole = hasRole("writer");

    const columns = [
      // @ts-ignore
      {
        title: "Name",
        field: "name",
        sorting: false,
        render: this.renderName,
        customFilterAndSearch: customSearchForImmutable
      },
      { title: "Pods Status", field: "status", sorting: false, render: this.renderStatus },
      {
        title: "CPU",
        field: "cpu",
        render: this.renderCPU,
        headerStyle: {
          textAlign: "center"
        }
      },
      {
        title: "Memory",
        field: "memory",
        render: this.renderMemory,
        headerStyle: {
          textAlign: "center"
        }
      },
      {
        title: "Created On",
        field: "active",
        sorting: false,
        render: this.renderCreatedTime,
        hidden: !hasWriterRole
      },
      {
        title: "Routes",
        sorting: false,
        render: this.renderExternalAccesses
      },
      {
        title: "Actions",
        field: "action",
        sorting: false,
        searchable: false,
        render: this.renderActions
      },
      {
        title: "",
        field: "moreAction",
        sorting: false,
        searchable: false,
        render: this.renderMoreActions
      }
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
          // size="large"
          onClick={() => {
            dispatch(push(`/applications/new`));
          }}>
          Create your first application
        </CustomizedButton>
      </div>
    );
  }

  public render() {
    const { classes, isLoading, isFirstLoaded, applications } = this.props;

    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
        {this.renderInternalEndpointsDialog()}
        {this.renderExternalAccessesDialog()}
        {this.renderDeleteConfirmDialog()}
        {/* {this.renderDuplicateConfirmDialog()} */}
        <div className={classes.root}>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : applications.size === 0 ? (
            this.renderEmpty()
          ) : (
            <MaterialTable
              tableRef={this.tableRef}
              options={{
                pageSize: 20,
                padding: "dense",
                draggable: false,
                rowStyle: {
                  verticalAlign: "baseline"
                },
                paging: applications.size > 20,
                headerStyle: {
                  color: "black",
                  backgroundColor: grey[100],
                  fontSize: 12,
                  fontWeight: 400,
                  height: 20,
                  paddingTop: 0,
                  paddingBottom: 0
                }
              }}
              // @ts-ignore
              columns={this.getColumns()}
              // detailPanel={this.renderDetails}
              // onRowClick={(_event, _rowData, togglePanel) => {
              //   togglePanel!();
              //   console.log(_event);
              // }}
              data={this.getData()}
              title=""
            />
          )}
        </div>
      </BasePage>
    );
  }
}

export const ApplicationListPage = withStyles(styles)(
  withNamespace(ApplicationListDataWrapper(connect(mapStateToProps)(ApplicationListRaw)))
);
