import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { BasePage } from "pages/BasePage";
import { AdminSidebar } from "pages/Admin/Sidebar";
import { Body } from "widgets/Label";
import { CustomizedButton } from "widgets/Button";
import { Link } from "react-router-dom";
import { SSOImplementDetails } from "pages/Admin/SSO/Details";
import { withSSO, WithSSOProps } from "hoc/withSSO";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithSSOProps {}

interface State {}

class AdminSSOPageRaw extends React.PureComponent<Props, State> {
  private renderEmptyState() {
    const { ssoConfig, isSSOConfigLoaded, isSSOConfigLoading } = this.props;
    const isFristLoading = !isSSOConfigLoaded && isSSOConfigLoading;
    return (
      <>
        <Body>
          The <strong>single sign-on</strong> feature allows you to configure access permissions for private components.
          Only users with the permissions you configured can access the resources behind. <br />
          Kalm SSO will integrate with your existing user system, such as <strong>github</strong>,{" "}
          <strong>gitlab</strong>, <strong>google</strong>, etc.
        </Body>
        <Box mt={2} width={300}>
          <CustomizedButton
            component={Link}
            to="/admin/sso/config"
            variant="contained"
            color="primary"
            disabled={isFristLoading}
          >
            {isFristLoading
              ? "Loading Single Sign-on Config ..."
              : ssoConfig
              ? "Update Single Sign-on Config"
              : "Enable Single Sign-on"}
          </CustomizedButton>
          {/*{loaded && ssoConfig ? <DangerButton>Delete Single Sign-On Config</DangerButton> : null}*/}
        </Box>
        <Box mt={2}>
          <SSOImplementDetails />
        </Box>
      </>
    );
  }

  public render() {
    return (
      <BasePage leftDrawer={<AdminSidebar />}>
        <Box p={2}>{this.renderEmptyState()}</Box>
      </BasePage>
    );
  }
}

export const AdminSSOPage = withStyles(styles)(withSSO(AdminSSOPageRaw));
