import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions, Application } from "../../actions";
import ApplicationFrom from "../../forms/Application";
import { RootState } from "../../reducers";
import { BasePage } from "../BasePage";
import { createApplicationAction } from "../../actions/application";
import { setSuccessNotificationAction } from "../../actions/notification";
import RemoteSubmitApplication from "../../forms/Application/remoteSubmitApplication";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3)
    }
  });

interface Props extends WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ApplicationNewRaw extends React.PureComponent<Props> {
  private submit = async (applicationFormValue: Application) => {
    const { dispatch } = this.props;
    await dispatch(createApplicationAction(applicationFormValue));
    await dispatch(setSuccessNotificationAction("Create application successfully"));
    await dispatch(push("/applications"));
  };

  public render() {
    const { classes } = this.props;
    return (
      <BasePage title="New Application" rightAction={<RemoteSubmitApplication />}>
        <div className={classes.root}>
          <ApplicationFrom onSubmit={this.submit} />
        </div>
      </BasePage>
    );
  }
}

export const ApplicationNew = withStyles(styles)(connect()(ApplicationNewRaw));
