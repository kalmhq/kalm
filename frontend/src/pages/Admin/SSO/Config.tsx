import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { BasePage } from "pages/BasePage";
import { AdminSidebar } from "pages/Admin/Sidebar";
import { SSOConfigForm } from "forms/SSOConfig";
import { SSOImplementDetails } from "pages/Admin/SSO/Details";
import { newEmptySSOConfig, SSOConfig } from "types/sso";
import { createSSOConfigAction, updateSSOConfigAction } from "actions/sso";
import { Loading } from "widgets/Loading";
import { push } from "connected-react-router";
import { setSuccessNotificationAction } from "actions/notification";
import { withSSO, WithSSOProps } from "hoc/withSSO";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithSSOProps {}

interface State {}

class AdminSSOConfigFormPageRaw extends React.PureComponent<Props, State> {
  private submit = async (config: SSOConfig) => {
    const { dispatch } = this.props;

    if (this.isEdit()) {
      return await dispatch(updateSSOConfigAction(config));
    } else {
      return await dispatch(createSSOConfigAction(config));
    }
  };

  private onSubmitSuccess = async () => {
    const { dispatch } = this.props;

    if (this.isEdit()) {
      dispatch(setSuccessNotificationAction("Update SSO Config Successfully"));
    } else {
      dispatch(setSuccessNotificationAction("Create SSO Config Successfully"));
    }

    dispatch(push("/admin/sso"));
  };

  private isEdit = () => {
    return !!this.props.ssoConfig;
  };

  public render() {
    const { ssoConfig, isSSOConfigLoaded } = this.props;

    if (!isSSOConfigLoaded) {
      return (
        <Box p={2}>
          <Loading />
        </Box>
      );
    }

    return (
      <BasePage leftDrawer={<AdminSidebar />}>
        <Box p={2}>
          <SSOConfigForm
            onSubmit={this.submit}
            initialValues={ssoConfig || newEmptySSOConfig()}
            onSubmitSuccess={this.onSubmitSuccess}
          />
          <Box mt={2}>
            <SSOImplementDetails />
          </Box>
        </Box>
      </BasePage>
    );
  }
}

export const AdminSSOConfigPage = withStyles(styles)(withSSO(AdminSSOConfigFormPageRaw));
