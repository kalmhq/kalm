import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { setSuccessNotificationAction } from "actions/notification";
import { createSSOConfigAction, updateSSOConfigAction } from "actions/sso";
import { push } from "connected-react-router";
import { SSOConfigForm } from "forms/SSOConfig";
import { withSSO, WithSSOProps } from "hoc/withSSO";
import { BasePage } from "pages/BasePage";
import React from "react";
import { newEmptySSOConfig, SSOConfig } from "types/sso";
import { InfoBox } from "widgets/InfoBox";
import { Loading } from "widgets/Loading";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithSSOProps {}

interface State {}

const pageObjectName: string = "Single Sign-On";

class SSOConfigFormPageRaw extends React.PureComponent<Props, State> {
  private submit = async (config: SSOConfig) => {
    const { dispatch } = this.props;

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
  private renderInfoBox() {
    return <InfoBox title={pageObjectName} options={[]} guideLink={"https://docs.kalm.dev/auth/sso"} />;
  }

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
          <SSOConfigForm onSubmit={this.submit} initial={ssoConfig ? ssoConfig : newEmptySSOConfig()} />
        </Box>
        {/* <Box p={2}>{this.renderInfoBox()}</Box> */}
      </BasePage>
    );
  }
}

export const SSOConfigPage = withStyles(styles)(withSSO(SSOConfigFormPageRaw));
