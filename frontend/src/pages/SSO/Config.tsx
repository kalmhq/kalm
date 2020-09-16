import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { BasePage } from "pages/BasePage";
import { SSOConfigForm } from "forms/SSOConfig";
import { SSOImplementDetails } from "pages/SSO/Details";
import { newEmptySSOConfig, SSOConfig, SSOConfigFormType } from "types/sso";
import { createSSOConfigAction, updateSSOConfigAction } from "actions/sso";
import { Loading } from "widgets/Loading";
import { push } from "connected-react-router";
import { setSuccessNotificationAction } from "actions/notification";
import { withSSO, WithSSOProps } from "hoc/withSSO";
import Immutable from "immutable";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithSSOProps {}

interface State {}

class SSOConfigFormPageRaw extends React.PureComponent<Props, State> {
  private submit = async (configForm: SSOConfigFormType) => {
    const { dispatch } = this.props;

    const config = Immutable.fromJS(configForm) as SSOConfig;
    if (this.isEdit()) {
      await dispatch(updateSSOConfigAction(config));
    } else {
      await dispatch(createSSOConfigAction(config));
    }

    if (this.isEdit()) {
      dispatch(setSuccessNotificationAction("Update SSO Config Successfully"));
    } else {
      dispatch(setSuccessNotificationAction("Create SSO Config Successfully"));
    }

    dispatch(push("/sso"));
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
      <BasePage>
        <Box p={2}>
          <SSOConfigForm
            onSubmit={this.submit}
            initial={ssoConfig ? (ssoConfig.toJS() as SSOConfigFormType) : newEmptySSOConfig()}
          />
          <Box mt={2}>
            <SSOImplementDetails />
          </Box>
        </Box>
      </BasePage>
    );
  }
}

export const SSOConfigPage = withStyles(styles)(withSSO(SSOConfigFormPageRaw));
