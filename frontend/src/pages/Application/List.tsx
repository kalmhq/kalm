import { Checkbox, createStyles, Switch, TextField, Theme, WithStyles, withStyles } from "@material-ui/core";
import ArchiveIcon from "@material-ui/icons/Archive";
import PowerSettingsNewIcon from "@material-ui/icons/PowerSettingsNew";
import RefreshIcon from "@material-ui/icons/Refresh";
import { push } from "connected-react-router";
import MaterialTable from "material-table";
import React from "react";
import {
  deleteApplicationAction,
  duplicateApplicationAction,
  loadApplicationAction,
  loadApplicationsAction,
  updateApplicationAction
} from "../../actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "../../actions/notification";
import { duplicateApplicationName, getApplicationByName } from "../../selectors/application";
import { ApplicationListItem } from "../../types/application";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { FoldButtonGroup } from "../../widgets/FoldButtonGroup";
import { Loading } from "../../widgets/Loading";
import { SmallCPULineChart, SmallMemoryLineChart } from "../../widgets/SmallLineChart";
import { BasePage } from "../BasePage";
import { Details } from "./Detail";
import { ApplicationListDataWrapper, WithApplicationsDataProps } from "./ListDataWrapper";
import { Link } from "react-router-dom";
const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3),
      "& tr.MuiTableRow-root td": {
        verticalAlign: "middle"
      }
    },
    expansionPanel: {
      boxShadow: "none"
    },
    panelSummary: {
      height: "48px !important",
      minHeight: "48px !important"
    },
    componentWrapper: {
      minWidth: "120px"
    },
    componentLine: {
      display: "inline-block"
    },
    bottomBar: {
      position: "fixed",
      height: "48px",
      bottom: "0",
      left: "0",
      right: "0",
      background: "#FFFFFF",
      boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.25)"
    },
    bottomContent: {
      maxWidth: "1200px",
      margin: "0 auto",
      display: "flex",
      justifyContent: "space-around",
      height: "48px",
      alignItems: "center"
    },
    applicationSelected: {
      display: "flex"
    },
    selectedNumber: {
      width: "20px",
      height: "20px",
      background: "#1976D2",
      color: "#ffffff",
      textAlign: "center",
      marginRight: "8px"
    },
    bottomActions: {
      width: "500px",
      display: "flex",
      justifyContent: "space-around"
    },
    bottomAction: {
      cursor: "pointer",
      display: "flex"
    },
    actionText: {
      marginLeft: "8px"
    },
    duplicateConfirmFileds: {
      marginTop: "20px",
      width: "100%",
      display: "flex",
      justifyContent: "space-between"
    }
  });

interface Props extends WithApplicationsDataProps, WithStyles<typeof styles> {}

interface State {
  isActiveConfirmDialogOpen: boolean;
  switchingIsActiveApplicationListItem?: ApplicationListItem;
  isDeleteConfirmDialogOpen: boolean;
  deletingApplicationListItem?: ApplicationListItem;
  isDuplicateConfirmDialogOpen: boolean;
  duplicatingApplicationListItem?: ApplicationListItem;
  checkedApplicationNames: {
    [key: string]: boolean;
  };
}

interface RowData extends ApplicationListItem {
  index: number;
}

class ApplicationListRaw extends React.PureComponent<Props, State> {
  private duplicateApplicationNameRef: React.RefObject<any>;
  private duplicateApplicationNamespaceRef: React.RefObject<any>;
  private tableRef: React.RefObject<MaterialTable<ApplicationListItem>> = React.createRef();

  private defaultState = {
    isActiveConfirmDialogOpen: false,
    switchingIsActiveApplicationListItem: undefined,
    isDeleteConfirmDialogOpen: false,
    deletingApplicationListItem: undefined,
    isDuplicateConfirmDialogOpen: false,
    duplicatingApplicationListItem: undefined,
    checkedApplicationNames: {}
  };

  constructor(props: Props) {
    super(props);
    this.state = this.defaultState;

    this.duplicateApplicationNameRef = React.createRef();
    this.duplicateApplicationNamespaceRef = React.createRef();
  }

  public onCreate = () => {
    this.props.dispatch(push(`/applications/new`));
  };

  private showSwitchingIsActiveConfirmDialog = (applicationListItem: ApplicationListItem) => {
    this.setState({
      isActiveConfirmDialogOpen: true,
      switchingIsActiveApplicationListItem: applicationListItem
    });
  };

  private closeSwitchingIsActiveConfirmDialog = () => {
    this.setState(this.defaultState);
  };

  private renderSwitchingIsActiveConfirmDialog = () => {
    const { isActiveConfirmDialogOpen, switchingIsActiveApplicationListItem } = this.state;

    let title, content;

    if (switchingIsActiveApplicationListItem && switchingIsActiveApplicationListItem.get("isActive")) {
      title = "Are you sure to disabled this application?";
      content =
        "Disabling this application will delete all running resources in your cluster. TODO: (will disk be deleted? will xxx deleted?)";
    } else {
      title = "Are you sure to active this application?";
      content = "Enabling this application will create xxxx resources. They will spend xxx CPU, xxx Memory. ";
    }

    return (
      <ConfirmDialog
        open={isActiveConfirmDialogOpen}
        onClose={this.closeSwitchingIsActiveConfirmDialog}
        title={title}
        content={content}
        onAgree={this.confirmSwitchIsActive}
      />
    );
  };

  private confirmSwitchIsActive = async () => {
    const { dispatch } = this.props;
    const { switchingIsActiveApplicationListItem } = this.state;

    if (switchingIsActiveApplicationListItem) {
      await dispatch(
        loadApplicationAction(
          switchingIsActiveApplicationListItem?.get("namespace"),
          switchingIsActiveApplicationListItem?.get("name")
        )
      );
      const application = getApplicationByName(switchingIsActiveApplicationListItem?.get("name"));
      await dispatch(updateApplicationAction(application.set("isActive", !application.get("isActive"))));
      dispatch(loadApplicationsAction());
    }
  };

  private showDuplicateConfirmDialog = (duplicatingApplicationListItem: ApplicationListItem) => {
    this.setState({
      isDuplicateConfirmDialogOpen: true,
      duplicatingApplicationListItem
    });
  };

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
            inputRef={this.duplicateApplicationNamespaceRef}
            label="Namespace"
            size="small"
            variant="outlined"
            defaultValue={duplicatingApplicationListItem?.get("namespace")}
            required
          />
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
        await dispatch(
          loadApplicationAction(
            duplicatingApplicationListItem.get("namespace"),
            duplicatingApplicationListItem.get("name")
          )
        );

        let newApplication = getApplicationByName(duplicatingApplicationListItem.get("name"));

        newApplication = newApplication.set("namespace", this.duplicateApplicationNamespaceRef.current.value);
        newApplication = newApplication.set("name", this.duplicateApplicationNameRef.current.value);
        newApplication = newApplication.set("isActive", false);

        dispatch(duplicateApplicationAction(newApplication));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private showDeleteConfirmDialog = (deletingApplicationListItem: ApplicationListItem) => {
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
        await dispatch(
          deleteApplicationAction(deletingApplicationListItem.get("namespace"), deletingApplicationListItem.get("name"))
        );
        await dispatch(setSuccessNotificationAction("Successfully delete an application"));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderDetails = (applicationListItem: ApplicationListItem) => {
    return <Details application={applicationListItem} dispatch={this.props.dispatch} />;
  };

  private renderCheckbox = (applicationListItem: RowData) => {
    return (
      <Checkbox
        onChange={() => {
          // deep copy, new obj
          const applicationNames = { ...this.state.checkedApplicationNames };
          applicationNames[applicationListItem.get("name")] = !applicationNames[applicationListItem.get("name")];
          this.setState({ checkedApplicationNames: applicationNames });
        }}
        value="secondary"
        color="primary"
        inputProps={{ "aria-label": "secondary checkbox" }}
      />
    );
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
    return <Link to={`/applications/${rowData.get("namespace")}/${rowData.get("name")}`}>{rowData.get("name")}</Link>;
  };

  private renderNamespace = (applicationListItem: RowData) => {
    return applicationListItem.get("namespace"); // ["default", "production", "ropsten"][index] || "default",
  };

  private renderEnable = (applicationListItem: RowData) => {
    return (
      <Switch
        checked={applicationListItem.get("isActive")}
        onChange={() => {
          this.showSwitchingIsActiveConfirmDialog(applicationListItem);
        }}
        value="checkedB"
        color="primary"
        inputProps={{ "aria-label": "active app.ication" }}
      />
    );
  };

  private renderComponents = (applicationListItem: RowData) => {
    // const { classes } = this.props;
    return null;
    // <ExpansionPanel className={classes.expansionPanel}>
    //   <ExpansionPanelSummary
    //     className={classes.panelSummary}
    //     expandIcon={<ExpandMoreIcon />}
    //     aria-controls="panel1a-content"
    //     id="panel1a-header">
    //     <div>
    //       <Dot color="green" />
    //       {applicationListItem.get("components").size} / {applicationListItem.get("components").size}
    //     </div>
    //   </ExpansionPanelSummary>
    //   <ExpansionPanelDetails>
    //     <div>
    //       {applicationListItem
    //         .get("components")
    //         .map(x => {
    //           return (
    //             <div key={x.get("name")} className={classes.componentWrapper}>
    //               <Dot color="green" />
    //               <div className={classes.componentLine} key={x.get("name")}>
    //                 {x.get("name")}
    //               </div>
    //             </div>
    //           );
    //         })
    //         .toArray()}
    //     </div>
    //   </ExpansionPanelDetails>
    // </ExpansionPanel>
  };

  private renderActions = (rowData: RowData) => {
    return (
      <FoldButtonGroup
        options={[
          {
            text: "Details",
            to: `/applications/${rowData.get("namespace")}/${rowData.get("name")}`,
            icon: "fullscreen"
          },
          {
            text: "Edit",
            to: `/applications/${rowData.get("namespace")}/${rowData.get("name")}/edit`,
            icon: "edit"
          },
          {
            text: "Duplicate",
            onClick: () => {
              this.showDuplicateConfirmDialog(rowData);
            },
            icon: "file_copy"
          },
          {
            text: "Logs",
            to: `/applications/${rowData.get("namespace")}/${rowData.get("name")}/logs`,
            icon: "view_headline"
          },
          {
            text: "Shell",
            to: `/applications/${rowData.get("namespace")}/${rowData.get("name")}/shells`,
            icon: "play_arrow"
          },
          {
            text: "Delete",
            onClick: () => {
              this.showDeleteConfirmDialog(rowData);
            },
            icon: "delete"
          }
        ]}
      />
    );
  };

  private getData = () => {
    const { applicationList } = this.props;
    const data = applicationList
      .map((applicationListItem, index) => {
        const rowData: any = applicationListItem;
        // @ts-ignore
        rowData.index = index;
        return rowData as RowData;
      })
      .toArray();
    return data;
  };

  public render() {
    const { classes, isLoading, isFirstLoaded } = this.props;
    return (
      <BasePage title="Applications">
        {this.renderDeleteConfirmDialog()}
        {this.renderDuplicateConfirmDialog()}
        {this.renderSwitchingIsActiveConfirmDialog()}
        <div className={classes.root}>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : (
            <MaterialTable
              tableRef={this.tableRef}
              actions={[
                {
                  isFreeAction: true,
                  icon: "add",
                  tooltip: "Add",
                  onClick: this.onCreate
                }
              ]}
              options={{
                padding: "dense",
                draggable: false,
                rowStyle: {
                  verticalAlign: "baseline"
                }
              }}
              columns={[
                // @ts-ignore
                { title: "", field: "checkbox", sorting: false, width: "20px", render: this.renderCheckbox },
                { title: "Name", field: "name", sorting: false, render: this.renderName },
                { title: "Namespace", field: "namespace", sorting: false, render: this.renderNamespace },
                { title: "Components", field: "components", sorting: false, render: this.renderComponents },
                { title: "CPU", field: "cpu", render: this.renderCPU },
                { title: "Memory", field: "memory", render: this.renderMemory },
                { title: "Enable", field: "active", sorting: false, render: this.renderEnable },
                {
                  title: "Action",
                  field: "action",
                  sorting: false,
                  searchable: false,
                  render: this.renderActions
                }
              ]}
              // detailPanel={this.renderDetails}
              // onRowClick={(_event, _rowData, togglePanel) => {
              //   togglePanel!();
              //   console.log(_event);
              // }}
              data={this.getData()}
              title="Applications"
            />
          )}
        </div>
        <div className={classes.bottomBar}>
          <div className={classes.bottomContent}>
            <div className={classes.applicationSelected}>
              <div className={classes.selectedNumber}>
                {Object.values(this.state.checkedApplicationNames).filter(Boolean).length}
              </div>{" "}
              Applications Selected
            </div>
            <div className={classes.bottomActions}>
              <div className={classes.bottomAction}>
                <RefreshIcon /> <div className={classes.actionText}> Restart</div>
              </div>
              <div className={classes.bottomAction}>
                <PowerSettingsNewIcon /> <div className={classes.actionText}> Power Off</div>
              </div>
              <div className={classes.bottomAction}>
                <ArchiveIcon /> <div className={classes.actionText}>Archive</div>
              </div>
            </div>
          </div>
        </div>
      </BasePage>
    );
  }
}

export const ApplicationListPage = withStyles(styles)(ApplicationListDataWrapper(ApplicationListRaw));
