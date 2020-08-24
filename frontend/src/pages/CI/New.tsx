import { Box, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { BasePage } from "pages/BasePage";
import { push } from "connected-react-router";
import { setSuccessNotificationAction } from "actions/notification";
import { withDeployKeys, WithDeployKeysProps } from "hoc/withDeployKeys";
import { DeployKeyFormik } from "forms/DeployKey";
import { DeployKeyFormTypeContent } from "types/deployKey";
import { createDeployKeyAction } from "actions/deployKey";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithDeployKeysProps {}

interface State {}

class DeployKeyNewPageRaw extends React.PureComponent<Props, State> {
  private submitFormik = async (config: DeployKeyFormTypeContent) => {
    try {
      const { dispatch } = this.props;
      await dispatch(createDeployKeyAction(config));
      dispatch(setSuccessNotificationAction("Create Deploy key Successfully"));
      dispatch(push("/ci"));
    } catch (error) {
      console.log(error);
    }
  };

  public render() {
    return (
      <BasePage secondHeaderRight={"New Deploy Key"}>
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item md={8}>
              <DeployKeyFormik
                // @ts-ignore
                onSubmit={this.submitFormik}
              />
            </Grid>
          </Grid>
        </Box>
      </BasePage>
    );
  }
}

export const DeployKeyNewPage = withStyles(styles)(withDeployKeys(DeployKeyNewPageRaw));
