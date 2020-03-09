import {
  CircularProgress,
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
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { push } from "connected-react-router";
import MaterialTable from "material-table";
import React from "react";
import { StatusTypeError, StatusTypePending, StatusTypeRunning } from "../../actions";
import {
  deleteApplicationAction,
  duplicateApplicationAction,
  updateApplicationAction
} from "../../actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "../../actions/notification";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { ApplicationDataWrapper, WithApplicationsDataProps } from "./DataWrapper";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Dot } from "../../widgets/Dot";
import RefreshIcon from "@material-ui/icons/Refresh";
import PowerSettingsNewIcon from "@material-ui/icons/PowerSettingsNew";
import ArchiveIcon from "@material-ui/icons/Archive";

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

const pendingStyles = (theme: Theme) =>
  createStyles({
    root: {
      position: "relative",
      display: "flex",
      alignItems: "center"
    },
    top: {
      color: "#eef3fd"
    },
    bottom: {
      color: "#6798e5",
      animationDuration: "550ms",
      position: "absolute",
      left: 0
    },
    text: {
      marginLeft: 14
    }
  });

class StatusPendingRaw extends React.PureComponent<WithStyles<typeof pendingStyles>> {
  public render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <CircularProgress
          variant="determinate"
          value={100}
          className={classes.top}
          size={18}
          thickness={4}
          // {...props}
        />
        <CircularProgress
          variant="indeterminate"
          disableShrink
          className={classes.bottom}
          size={18}
          thickness={4}
          // {...props}
        />
        <span className={classes.text}>Pending</span>
      </div>
    );
  }
}

const StatusPending = withStyles(pendingStyles)(StatusPendingRaw);

interface State {
  isEnabledConfirmDialogOpen: boolean;
  switchingIsEnabledApplicationId: string;
  switchingIsEnabledTitle: string;
  switchingIsEnabledContent: string;
  isDeleteConfirmDialogOpen: boolean;
  deletingApplicationId?: string;
  checkedApplicationIds: {
    [key: string]: boolean;
  };
}

class ApplicationListRaw extends React.PureComponent<Props, State> {
  private defaultState = {
    isEnabledConfirmDialogOpen: false,
    switchingIsEnabledApplicationId: "",
    switchingIsEnabledTitle: "",
    switchingIsEnabledContent: "",
    isDeleteConfirmDialogOpen: false,
    deletingApplicationId: "",
    checkedApplicationIds: {}
  };

  constructor(props: Props) {
    super(props);
    this.state = this.defaultState;
  }

  public onCreate = () => {
    this.props.dispatch(push(`/applications/new`));
  };

  private renderSwitchingIsEnabledConfirmDialog = () => {
    const { isEnabledConfirmDialogOpen, switchingIsEnabledTitle, switchingIsEnabledContent } = this.state;

    return (
      <ConfirmDialog
        open={isEnabledConfirmDialogOpen}
        onClose={this.closeEnabledConfirmDialog}
        title={switchingIsEnabledTitle}
        content={switchingIsEnabledContent}
        onAgree={this.switchEnabledConfirmedComponent}
      />
    );
  };

  private closeEnabledConfirmDialog = () => {
    this.setState(this.defaultState);
  };

  private showSwitchingIsEnabledDialog = (applicationId: string) => {
    const { applications } = this.props;
    const application = applications.find(x => x.get("id") === applicationId)!;

    let title, content;

    if (application.get("isActive")) {
      title = "Are you sure to disabled this application?";
      content =
        "Disabling this application will delete all running resources in your cluster. TODO: (will disk be deleted? will xxx deleted?)";
    } else {
      title = "Are you sure to enable this application?";
      content = "Enabling this application will create xxxx resources. They will spend xxx CPU, xxx Memory. ";
    }

    this.setState({
      isEnabledConfirmDialogOpen: true,
      switchingIsEnabledApplicationId: applicationId,
      switchingIsEnabledTitle: title,
      switchingIsEnabledContent: content
    });
  };

  private switchEnabledConfirmedComponent = () => {
    const { applications, dispatch } = this.props;
    const { switchingIsEnabledApplicationId } = this.state;
    const application = applications.find(x => x.get("id") === switchingIsEnabledApplicationId)!;

    dispatch(updateApplicationAction(application.get("id"), application.set("isActive", !application.get("isActive"))));
  };

  private closeConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
      deletingApplicationId: undefined
    });
  };

  private deleteConfirmedApplication = async () => {
    const { dispatch } = this.props;
    try {
      await dispatch(deleteApplicationAction(this.state.deletingApplicationId!));
      await dispatch(setSuccessNotificationAction("Successfully delete an application"));
    } catch {
      dispatch(setErrorNotificationAction("Something wrong"));
    }
  };

  private setDeletingApplicationAndConfirm = (applicationId: string) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingApplicationId: applicationId
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
    console.log(this.state.checkedApplicationIds);
    const { dispatch, applications, classes, isLoading, isFirstLoaded } = this.props;
    const data = applications.map((application, index) => {
      const handleChange = () => {
        this.showSwitchingIsEnabledDialog(application.get("id"));
      };

      const onDeleteClick = () => {
        this.setDeletingApplicationAndConfirm(application.get("id"));
      };

      let status = null;

      switch (application.get("status").get("status")) {
        case StatusTypePending:
          status = <StatusPending />;
          break;
        case StatusTypeRunning:
          status = <CheckCircleIcon color="primary" />;
          break;
        case StatusTypeError:
          status = <CheckCircleIcon color="primary" />;
          break;
      }

      const components = (
        <ExpansionPanel className={classes.expansionPanel}>
          <ExpansionPanelSummary
            className={classes.panelSummary}
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header">
            <div>
              <Dot color="green" />
              {application.get("components").size} / {application.get("components").size}
            </div>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <div>
              {application
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
                dispatch(push(`/applications/${application.get("id")}/edit`));
              }}>
              <EditIcon />
            </IconButton>

            <IconButton
              aria-label="edit"
              onClick={() => {
                dispatch(duplicateApplicationAction(application.get("id")));
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
              const applicationIds = { ...this.state.checkedApplicationIds };
              applicationIds[application.get("id")] = !applicationIds[application.get("id")];
              this.setState({ checkedApplicationIds: applicationIds });
            }}
            value="secondary"
            color="primary"
            inputProps={{ "aria-label": "secondary checkbox" }}
          />
        ),
        name: application.get("name"),
        namespace: ["default", "production", "ropsten"][index] || "default",
        enable: (
          <Switch
            checked={application.get("isActive")}
            onChange={handleChange}
            value="checkedB"
            color="primary"
            inputProps={{ "aria-label": "enable app.ication" }}
          />
        ),
        components,
        status: status
      };
    });
    return (
      <BasePage title="Applications" onCreate={this.onCreate} createButtonText="Add An Application">
        {this.renderDeleteConfirmDialog()}
        {this.renderSwitchingIsEnabledConfirmDialog()}
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
                { title: "Status", field: "status", sorting: false },
                { title: "Enable", field: "enable", sorting: false },
                {
                  title: "Action",
                  field: "action",
                  sorting: false,
                  searchable: false
                }
              ]}
              data={data.toArray()}
              title="Applications"
            />
          )}
        </div>
        <div className={classes.bottomBar}>
          <div className={classes.bottomContent}>
            <div className={classes.applicationSelected}>
              <div className={classes.selectedNumber}>
                {Object.values(this.state.checkedApplicationIds).filter(Boolean).length}
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

export const ApplicationList = withStyles(styles)(ApplicationDataWrapper(ApplicationListRaw));
