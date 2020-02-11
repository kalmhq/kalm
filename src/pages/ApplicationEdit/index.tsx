import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { match } from "react-router-dom";
import { ThunkDispatch } from "redux-thunk";
import ApplicationForm from "../../forms/Application";
import { Actions, ApplicationFormValues } from "../../actions";
import { updateApplicationAction } from "../../actions/application";
import { RootState } from "../../reducers";
import { BasePage } from "../BasePage";
import { setSuccessNotificationAction } from "../../actions/notification";

const mapStateToProps = (
  state: RootState,
  ownProps: { match: match<{ applicationId: string }> }
) => {
  const applicationId = ownProps.match.params.applicationId;
  const application = state
    .get("applications")
    .get("applications")
    .get(applicationId);

  return { applicationId, application };
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

class ApplicationEdit extends React.PureComponent<Props> {
  private submit = async (applicationFormValues: ApplicationFormValues) => {
    const { dispatch, applicationId } = this.props;
    await dispatch(
      updateApplicationAction(applicationId, applicationFormValues)
    );
    await dispatch(
      setSuccessNotificationAction("Edit spplication successfully")
    );
    await dispatch(push("/applications"));
  };

  public render() {
    const { application, classes } = this.props;
    return (
      <BasePage title={`Edit Application {application.name}`}>
        <div className={classes.root}>
          <ApplicationForm onSubmit={this.submit} initialValues={application} />
        </div>
      </BasePage>
    );
  }
}

export default withStyles(styles)(connect(mapStateToProps)(ApplicationEdit));
