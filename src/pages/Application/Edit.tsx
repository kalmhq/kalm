import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { RouteChildrenProps } from "react-router-dom";
import { Application } from "../../actions";
import { updateApplicationAction } from "../../actions/application";
import { setSuccessNotificationAction } from "../../actions/notification";
import ApplicationForm from "../../forms/Application";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { ApplicationDataWrapper, WithApplicationsDataProps } from "./DataWrapper";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface Props
  extends WithApplicationsDataProps,
    WithStyles<typeof styles>,
    RouteChildrenProps<{ applicationId: string }> {}

class ApplicationEditRaw extends React.PureComponent<Props> {
  private submit = async (application: Application) => {
    const { dispatch, match } = this.props;
    const { applicationId } = match!.params;

    await dispatch(updateApplicationAction(applicationId, application));
    await dispatch(setSuccessNotificationAction("Edit application successfully"));
    await dispatch(push("/applications"));
  };

  private getApplication() {
    const { applications, match } = this.props;
    const { applicationId } = match!.params;
    return applications.find(x => x.get("id") === applicationId)!;
  }

  public render() {
    const { isLoading, isFirstLoaded } = this.props;
    const application = this.getApplication();
    return (
      <BasePage title={`Edit Application ${application && application.get("name")}`}>
        {isLoading && !isFirstLoaded ? (
          <Loading />
        ) : (
          <ApplicationForm onSubmit={this.submit} initialValues={application} />
        )}
      </BasePage>
    );
  }
}

export const ApplicationEdit = withStyles(styles)(ApplicationDataWrapper(ApplicationEditRaw));
