import {
  createStyles,
  IconButton,
  Theme,
  WithStyles,
  withStyles,
  CircularProgress,
  Switch
} from "@material-ui/core";
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
  StatusTypePending,
  StatusTypeCreating,
  StatusTypeError,
  StatusTypeRunning
} from "../../actions";
import {
  deleteApplicationAction,
  updateApplicationAction
} from "../../actions/application";
import { RootState } from "../../reducers";
import { BasePage } from "../BasePage";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import { ConfirmDialog } from "../../widgets/ConfirmDialog";

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
}

class List extends React.PureComponent<Props, State> {
  private defaultState = {
    isEnabledConfirmDialogOpen: false,
    switchingIsEnabledApplicationId: "",
    switchingIsEnabledTitle: "",
    switchingIsEnabledContent: ""
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

  public render() {
    const { dispatch, applications, classes } = this.props;
    const data = applications.map((application, index) => {
      const handleChange = () => {
        this.showSwitchingIsEnabledDialog(application.get("id"));
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
                dispatch(
                  push(`/applications/${application.get("id")}/duplicate`)
                );
              }}
            >
              <FileCopyIcon />
            </IconButton>

            <IconButton
              aria-label="delete"
              onClick={() => {
                // TODO delete confirmation
                dispatch(deleteApplicationAction(application.get("id")));
              }}
            >
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
          .map(x => x.get("name"))
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
