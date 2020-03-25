import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { RouteChildrenProps } from "react-router-dom";
import { updateApplicationAction } from "../../actions/application";
import { setSuccessNotificationAction } from "../../actions/notification";
import ApplicationForm from "../../forms/Application";
import RemoteSubmitApplication from "../../forms/Application/remoteSubmitApplication";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { ApplicationItemDataWrapper, WithApplicationsDataProps } from "./ItemDataWrapper";
import { Application } from "../../types/application";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3)
    }
  });

interface Props
  extends WithApplicationsDataProps,
    WithStyles<typeof styles>,
    RouteChildrenProps<{ applicationName: string }> {}

class ApplicationEditRaw extends React.PureComponent<Props> {
  private submit = async (application: Application) => {
    const { dispatch } = this.props;
    // const { applicationName } = match!.params;
    // console.log(application, application.toJS());
    await dispatch(updateApplicationAction(application));
    await dispatch(setSuccessNotificationAction("Edit application successfully"));
    await dispatch(push("/applications"));
  };

  public render() {
    const { isLoading, application } = this.props;
    // console.log("application", application?.toJS());
    return (
      <BasePage
        title={`Edit Application ${application && application.get("name")}`}
        rightAction={<RemoteSubmitApplication />}>
        {isLoading ? <Loading /> : <ApplicationForm onSubmit={this.submit} initialValues={application} isEdit={true} />}
      </BasePage>
    );
  }
}

export const ApplicationEdit = withStyles(styles)(ApplicationItemDataWrapper(ApplicationEditRaw));
