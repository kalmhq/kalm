import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { RouteChildrenProps } from "react-router-dom";
import { updateApplicationAction } from "../../actions/application";
import ApplicationForm from "../../forms/Application";
import RemoteSubmitApplication from "../../forms/Application/remoteSubmitApplication";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { ApplicationItemDataWrapper, WithApplicationItemDataProps } from "./ItemDataWrapper";
import { Application } from "../../types/application";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3)
    }
  });

interface Props
  extends WithApplicationItemDataProps,
    WithStyles<typeof styles>,
    RouteChildrenProps<{ applicationName: string }> {}

class ApplicationEditRaw extends React.PureComponent<Props> {
  private submit = async (application: Application) => {
    const { dispatch } = this.props;

    await dispatch(updateApplicationAction(application));
  };

  public render() {
    const { isLoading, application } = this.props;

    return (
      <BasePage
        title={`Edit Application ${application && application.get("name")}`}
        rightAction={<RemoteSubmitApplication />}>
        {isLoading ? <Loading /> : <ApplicationForm onSubmit={this.submit} initialValues={application} isEdit={true} />}
      </BasePage>
    );
  }
}

export const ApplicationEdit = withStyles(styles)(
  ApplicationItemDataWrapper({ reloadFrequency: 0 })(ApplicationEditRaw)
);
