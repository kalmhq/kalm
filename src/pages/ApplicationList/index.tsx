import {
  CircularProgress,
  createStyles,
  IconButton,
  Switch,
  Theme,
  WithStyles,
  withStyles
} from "@material-ui/core";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { push } from "connected-react-router";
import MaterialTable from "material-table";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import {
  Actions,
  StatusTypeError,
  StatusTypePending,
  StatusTypeRunning
} from "../../actions";
import {
  deleteApplicationAction,
  duplicateApplicationAction,
  updateApplicationAction
} from "../../actions/application";
import {
  setErrorNotificationAction,
  setSuccessNotificationAction
} from "../../actions/notification";
import { RootState } from "../../reducers";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";
import { BasePage } from "../BasePage";

const mapStateToProps = (state: RootState) => {
  return {
    applications: state
      .get("applications")
      .get("applications")
      .toList()
  };
};

type StateProps = ReturnType<typeof mapStateToProps>;

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface Props extends StateProps, WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

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

class StatusPendingRaw extends React.PureComponent<
  WithStyles<typeof pendingStyles>
> {
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
}

class List extends React.PureComponent<Props, State> {
  private defaultState = {
    isEnabledConfirmDialogOpen: false,
    switchingIsEnabledApplicationId: "",
    switchingIsEnabledTitle: "",
    switchingIsEnabledContent: "",
    isDeleteConfirmDialogOpen: false,
    deletingApplicationId: ""
  };

  constructor(props: Props) {
    super(props);
    this.state = this.defaultState;
  }

  public onCreate = () => {
    this.props.dispatch(push(`/applications/new`));
  };

  private renderSwitchingIsEnabledConfirmDialog = () => {
    console.log(this.state);
    const {
      isEnabledConfirmDialogOpen,
      switchingIsEnabledTitle,
      switchingIsEnabledContent
    } = this.state;

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

    if (application.get("isEnabled")) {
      title = "Are you sure to disabled this application?";
      content =
        "Disabling this application will delete all running resources in your cluster. TODO: (will disk be deleted? will xxx deleted?)";
    } else {
      title = "Are you sure to enable this application?";
      content =
        "Enabling this application will create xxxx resources. They will spend xxx CPU, xxx Memory. ";
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
    const application = applications.find(
      x => x.get("id") === switchingIsEnabledApplicationId
    )!;

    dispatch(
      updateApplicationAction(
        application.get("id"),
        application.set("isEnabled", !application.get("isEnabled"))
      )
    );
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
      await dispatch(
        deleteApplicationAction(this.state.deletingApplicationId!)
      );
      await dispatch(
        setSuccessNotificationAction("Successfully delete an application")
      );
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
    const { dispatch, applications, classes } = this.props;
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

      return {
        action: (
          <>
            <IconButton
              aria-label="edit"
              onClick={() => {
                dispatch(push(`/applications/${application.get("id")}/edit`));
              }}
            >
              <EditIcon />
            </IconButton>

            <IconButton
              aria-label="edit"
              onClick={() => {
                dispatch(duplicateApplicationAction(application.get("id")));
              }}
            >
              <FileCopyIcon />
            </IconButton>

            <IconButton aria-label="delete" onClick={onDeleteClick}>
              <DeleteIcon />
            </IconButton>
          </>
        ),
        name: application.get("name"),
        namespace: ["default", "production", "ropsten"][index] || "default",
        enable: (
          <Switch
            checked={application.get("isEnabled")}
            onChange={handleChange}
            value="checkedB"
            color="primary"
            inputProps={{ "aria-label": "enable app.ication" }}
          />
        ),
        components: application
          .get("components")
          .map(x => <div key={x.get("name")}>{x.get("name")}</div>)
          .toArray(),
        status: status
      };
    });
    return (
      <BasePage
        title="Applications"
        onCreate={this.onCreate}
        createButtonText="Add An Application"
      >
        {this.renderDeleteConfirmDialog()}
        {this.renderSwitchingIsEnabledConfirmDialog()}
        <div className={classes.root}>
          <MaterialTable
            options={{
              padding: "dense"
            }}
            columns={[
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
            title=""
          />
        </div>
      </BasePage>
    );
  }
}

export default withStyles(styles)(connect(mapStateToProps)(List));
