import {
  createStyles,
  IconButton,
  Switch,
  Theme,
  WithStyles,
  withStyles,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Checkbox
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { push } from "connected-react-router";
import MaterialTable from "material-table";
import React from "react";
import {
  deleteApplicationAction,
  duplicateApplicationAction,
  updateApplicationAction
} from "../../actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "../../actions/notification";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { ApplicationListDataWrapper, WithApplicationsDataProps } from "./ListDataWrapper";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Dot } from "../../widgets/Dot";
import RefreshIcon from "@material-ui/icons/Refresh";
import PowerSettingsNewIcon from "@material-ui/icons/PowerSettingsNew";
import ArchiveIcon from "@material-ui/icons/Archive";
import { getApplicationByName } from "../../selectors/application";
import { ApplicationListItem } from "../../types/application";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
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
    }
  });

interface Props extends WithApplicationsDataProps, WithStyles<typeof styles> {}

interface State {
  isActiveConfirmDialogOpen: boolean;
  switchingIsActiveApplicationName: string;
  switchingIsActiveTitle: string;
  switchingIsActiveContent: string;
  isDeleteConfirmDialogOpen: boolean;
  deletingApplicationListItem?: ApplicationListItem;
  checkedApplicationNames: {
    [key: string]: boolean;
  };
}

class ApplicationListRaw extends React.PureComponent<Props, State> {
  private defaultState = {
    isActiveConfirmDialogOpen: false,
    switchingIsActiveApplicationName: "",
    switchingIsActiveTitle: "",
    switchingIsActiveContent: "",
    isDeleteConfirmDialogOpen: false,
    deletingApplicationListItem: undefined,
    checkedApplicationNames: {}
  };

  constructor(props: Props) {
    super(props);
    this.state = this.defaultState;
  }

  public onCreate = () => {
    this.props.dispatch(push(`/applications/new`));
  };

  private renderSwitchingIsActiveConfirmDialog = () => {
    const { isActiveConfirmDialogOpen, switchingIsActiveTitle, switchingIsActiveContent } = this.state;

    return (
      <ConfirmDialog
        open={isActiveConfirmDialogOpen}
        onClose={this.closeEnabledConfirmDialog}
        title={switchingIsActiveTitle}
        content={switchingIsActiveContent}
        onAgree={this.switchEnabledConfirmedComponent}
      />
    );
  };

  private closeEnabledConfirmDialog = () => {
    this.setState(this.defaultState);
  };

  private showSwitchingIsActiveDialog = (applicationName: string) => {
    const { applicationList } = this.props;
    const application = applicationList.find(x => x.get("name") === applicationName)!;

    let title, content;

    if (application.get("isActive")) {
      title = "Are you sure to disabled this application?";
      content =
        "Disabling this application will delete all running resources in your cluster. TODO: (will disk be deleted? will xxx deleted?)";
    } else {
      title = "Are you sure to active this application?";
      content = "Enabling this application will create xxxx resources. They will spend xxx CPU, xxx Memory. ";
    }

    this.setState({
      isActiveConfirmDialogOpen: true,
      switchingIsActiveApplicationName: applicationName,
      switchingIsActiveTitle: title,
      switchingIsActiveContent: content
    });
  };

  private switchEnabledConfirmedComponent = () => {
    const { dispatch } = this.props;
    const { switchingIsActiveApplicationName } = this.state;

    // const application = applicationList.find(x => x.get("name") === switchingIsActiveApplicationName)!;
    const application = getApplicationByName(switchingIsActiveApplicationName);
    dispatch(updateApplicationAction(application.set("isActive", !application.get("isActive"))));
  };

  private closeConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
      deletingApplicationListItem: undefined
    });
  };

  private deleteConfirmedApplication = async () => {
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
      dispatch(setErrorNotificationAction("Something wrong"));
    }
  };

  // private renderDetails = (rowData: any) => {
  //   return <div>123</div>;
  // };

  private setDeletingApplicationAndConfirm = (deletingApplicationListItem: ApplicationListItem) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingApplicationListItem
    });
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeConfirmDialog}
        title="Are you sure to delete this Application?"
        content="This application is already disabled. You will lost this application config, and this action is irrevocable."
        onAgree={this.deleteConfirmedApplication}
      />
    );
  };

  public render() {
    const { dispatch, applicationList, classes, isLoading, isFirstLoaded } = this.props;
    const data = applicationList.map((applicationListItem, index) => {
      const handleChange = () => {
        this.showSwitchingIsActiveDialog(applicationListItem.get("name"));
      };

      const onDeleteClick = () => {
        this.setDeletingApplicationAndConfirm(applicationListItem);
      };

      const components = (
        <ExpansionPanel className={classes.expansionPanel}>
          <ExpansionPanelSummary
            className={classes.panelSummary}
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header">
            <div>
              <Dot color="green" />
              {applicationListItem.get("components").size} / {applicationListItem.get("components").size}
            </div>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <div>
              {applicationListItem
                .get("components")
                .map(x => {
                  return (
                    <div key={x.get("name")} className={classes.componentWrapper}>
                      <Dot color="green" />
                      <div className={classes.componentLine} key={x.get("name")}>
                        {x.get("name")}
                      </div>
                    </div>
                  );
                })
                .toArray()}
            </div>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      );

      return {
        action: (
          <>
            <IconButton
              aria-label="edit"
              onClick={() => {
                dispatch(
                  push(`/applications/${applicationListItem.get("namespace")}/${applicationListItem.get("name")}/edit`)
                );
              }}>
              <EditIcon />
            </IconButton>

            <IconButton
              aria-label="edit"
              onClick={() => {
                dispatch(duplicateApplicationAction(applicationListItem.get("name")));
              }}>
              <FileCopyIcon />
            </IconButton>

            <IconButton aria-label="delete" onClick={onDeleteClick}>
              <DeleteIcon />
            </IconButton>
          </>
        ),
        checkbox: (
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
        ),
        name: applicationListItem.get("name"),
        namespace: applicationListItem.get("namespace"), // ["default", "production", "ropsten"][index] || "default",
        active: (
          <Switch
            checked={applicationListItem.get("isActive")}
            onChange={handleChange}
            value="checkedB"
            color="primary"
            inputProps={{ "aria-label": "active app.ication" }}
          />
        ),
        components
      };
    });
    return (
      <BasePage title="Applications">
        {this.renderDeleteConfirmDialog()}
        {this.renderSwitchingIsActiveConfirmDialog()}
        <div className={classes.root}>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : (
            <MaterialTable
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
                { title: "", field: "checkbox", sorting: false, width: "20px" },
                { title: "Name", field: "name", sorting: false },
                { title: "Namespace", field: "namespace", sorting: false },
                { title: "Components", field: "components", sorting: false },
                { title: "Enable", field: "active", sorting: false },
                {
                  title: "Action",
                  field: "action",
                  sorting: false,
                  searchable: false
                }
              ]}
              // detailPanel={this.renderDetails}
              // onRowClick={(_event, _rowData, togglePanel) => togglePanel!()}
              data={data.toArray()}
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
