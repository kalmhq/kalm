import { Box, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { BasePage } from "pages/BasePage";
import { push } from "connected-react-router";
import { setSuccessNotificationAction } from "actions/notification";
import { withDeployKeys, WithDeployKeysProps } from "hoc/withDeployKeys";
import { DeployKeyForm } from "forms/DeployKey";
import { DeployKey } from "types/deployKey";
import { createDeployKeyAction } from "actions/deployKey";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithDeployKeysProps {}

interface State {}

class DeployKeyNewPageRaw extends React.PureComponent<Props, State> {
  private submit = async (config: DeployKey) => {
    const { dispatch } = this.props;
    return await dispatch(createDeployKeyAction(config));
  };

  private onSubmitSuccess = async () => {
    const { dispatch } = this.props;
    dispatch(setSuccessNotificationAction("Create Deploy key Successfully"));
    dispatch(push("/ci"));
  };

  public render() {
    return (
      <BasePage secondHeaderRight={"New Deploy Key"}>
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item md={8}>
              <DeployKeyForm onSubmit={this.submit} onSubmitSuccess={this.onSubmitSuccess} />
            </Grid>
          </Grid>
        </Box>
      </BasePage>
    );
  }
}

export const DeployKeyNewPage = withStyles(styles)(withDeployKeys(DeployKeyNewPageRaw));
