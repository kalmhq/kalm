import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "../../types";
import ApplicationForm, { applicationInitialValues } from "../../forms/Application";
import { RootState } from "../../reducers";
import { BasePage } from "../BasePage";
import { createApplicationAction } from "../../actions/application";
import RemoteSubmitApplication from "../../forms/Application/remoteSubmitApplication";
import { Application } from "../../types/application";
import { getCurrentNamespace } from "../../selectors/namespace";

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
  };

  public render() {
    const { classes } = this.props;
    return (
      <BasePage title="New Application" rightAction={<RemoteSubmitApplication />}>
        <div className={classes.root}>
          <ApplicationForm
            onSubmit={this.submit}
            isEdit={false}
            initialValues={applicationInitialValues.set("namespace", getCurrentNamespace())}
          />
        </div>
      </BasePage>
    );
  }
}

export const ApplicationNew = withStyles(styles)(connect()(ApplicationNewRaw));
