import { Box, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { BasePage } from "pages/BasePage";
import { push } from "connected-react-router";
import { setSuccessNotificationAction } from "actions/notification";
import { withDeployAccessTokens, WithDeployAccessTokensProps } from "hoc/withDeployAccessTokens";
import { DeployAccessTokenForm } from "forms/DeployAccessToken";
import { DeployAccessToken } from "types/deployAccessToken";
import { createDeployAccessTokenAction } from "actions/deployAccessToken";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithDeployAccessTokensProps {}

interface State {}

class DeployAccessTokenNewPageRaw extends React.PureComponent<Props, State> {
  private submit = async (config: DeployAccessToken) => {
    const { dispatch } = this.props;
    return await dispatch(createDeployAccessTokenAction(config));
  };

  private onSubmitSuccess = async (config: DeployAccessToken) => {
    const { dispatch } = this.props;
    dispatch(setSuccessNotificationAction("Create Deploy key Successfully"));
    dispatch(push("/ci/keys/" + config.get("name")));
  };

  public render() {
    return (
      <BasePage secondHeaderRight={"New Deploy Key"}>
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item md={8}>
              <DeployAccessTokenForm onSubmit={this.submit} onSubmitSuccess={this.onSubmitSuccess} />
            </Grid>
          </Grid>
        </Box>
      </BasePage>
    );
  }
}

export const DeployAccessTokenNewPage = withStyles(styles)(withDeployAccessTokens(DeployAccessTokenNewPageRaw));
