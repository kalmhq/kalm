import React from "react";
import { Box, createStyles, Theme, Typography, WithStyles } from "@material-ui/core";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { KPanel } from "widgets/KPanel";
import Avatar from "@material-ui/core/Avatar";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import { Alert, AlertTitle } from "@material-ui/lab";
import Button from "@material-ui/core/Button";
import { BasePage } from "pages/BasePage";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import withStyles from "@material-ui/core/styles/withStyles";
import { stopImpersonating } from "api/realApi/index";
import { push } from "connected-react-router";

const styles = (theme: Theme) =>
  createStyles({
    large: {
      width: theme.spacing(9),
      height: theme.spacing(9),
    },
  });

interface Props extends WithStyles<typeof styles>, WithUserAuthProps, WithNamespaceProps {}

interface State {}

class ProfilePageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderAvatar = () => {
    const { auth, classes } = this.props;

    if (!!auth.avatarUrl) {
      return <Avatar src={auth.avatarUrl} className={classes.large} />;
    }
  };

  private renderClusterRole = () => {
    const { canViewCluster, canEditCluster, canManageCluster } = this.props;

    if (canManageCluster()) {
      return <strong>Cluster Owner</strong>;
    }

    if (canEditCluster()) {
      return <strong>Cluster Editor</strong>;
    }

    if (canViewCluster()) {
      return <strong>Cluster Viewer</strong>;
    }

    return null;
  };

  private getApplicationRoles = () => {
    const { canViewNamespace, canEditNamespace, canManageNamespace, applications } = this.props;

    return applications
      .map((application) => {
        let role = "";

        if (canManageNamespace(application.name)) {
          role = "Owner";
        } else if (canEditNamespace(application.name)) {
          role = "Editor";
        } else if (canViewNamespace(application.name)) {
          role = "Viewer";
        }
        return { applicationName: application.name, role: role };
      })
      .filter((x) => !!x.role);
  };

  private renderApplicationRole = () => {
    const { applications } = this.props;
    const roles = this.getApplicationRoles();

    if (applications.length > 0 && roles.length === 0) {
      return (
        <Alert severity="warning">
          <AlertTitle>No Role</AlertTitle>
          <Typography>
            Although you have been authenticated, you do not have any role, which means you cannot access any resources.
            Please contact your cluster admin for help.
          </Typography>
        </Alert>
      );
    } else {
      return roles.map((x) => (
        <p key={x.applicationName}>
          <strong>{x.role}</strong> in application <strong>{x.applicationName}</strong>
        </p>
      ));
    }
  };

  private renderEmailOrName = () => {
    const { auth } = this.props;
    let label = "";
    let content = "";

    if (auth.impersonation !== "") {
      if (auth.impersonationType === "group") {
        label = "Group";
      } else {
        label = "User";
      }

      content = auth.impersonation;
    } else {
      content = auth.email;
    }

    if (label === "") {
      label = content.indexOf("@") >= 0 ? "Email" : "Access Token";
    }

    return (
      <p>
        {label}: {content}
      </p>
    );
  };

  private stopImpersonation = async () => {
    stopImpersonating();
    await this.props.dispatch(push("/"));
    window.location.reload();
  };

  private renderBasicInfo = () => {
    const { auth } = this.props;

    return (
      <KPanel
        content={
          <Box p={2}>
            {auth.impersonation !== "" && (
              <Box mb={2}>
                <Alert
                  severity="info"
                  action={
                    <Button color="inherit" size="small" onClick={this.stopImpersonation}>
                      STOP
                    </Button>
                  }
                >
                  {auth.impersonationType === "user" ? (
                    <span>
                      You are impersonating <strong>{auth.impersonation}</strong>
                    </span>
                  ) : (
                    <span>
                      You are impersonating a member in <strong>{auth.impersonation}</strong> group
                    </span>
                  )}
                </Alert>
              </Box>
            )}
            {this.renderAvatar()}
            {this.renderEmailOrName()}
            {auth.impersonation === "" && auth.groups && auth.groups.length > 0 ? <p>Groups: {auth.groups}</p> : null}
          </Box>
        }
      />
    );
  };

  private renderRoles = () => {
    return (
      <KPanel
        title="Roles"
        content={
          <Box p={2}>
            {this.renderClusterRole()}
            {this.renderApplicationRole()}
          </Box>
        }
      />
    );
  };

  private renderPolicies = () => {
    const { auth } = this.props;
    return (
      <KPanel
        content={
          <Box p={2}>
            <p>
              Kalm use <BlankTargetLink href="https://casbin.org/">casbin</BlankTargetLink> to authorize resources. The
              following policy is the most accurate description of the account permissions.
            </p>
            <pre>{auth.policies}</pre>
          </Box>
        }
      />
    );
  };

  private renderContent = () => {
    return (
      <>
        <Box mb={2}>{this.renderBasicInfo()}</Box>
        <Box mb={2}>{this.renderRoles()}</Box>

        {this.props.auth.policies !== "" && (
          <CollapseWrapper title="View detailed permission policies">
            <Box mb={2} mt={2}>
              {this.renderPolicies()}
            </Box>
          </CollapseWrapper>
        )}
      </>
    );
  };

  public render() {
    return (
      <BasePage>
        <Box p={2}>{this.renderContent()}</Box>
      </BasePage>
    );
  }
}

export const ProfilePage = withStyles(styles)(withNamespace(withUserAuth(ProfilePageRaw)));
