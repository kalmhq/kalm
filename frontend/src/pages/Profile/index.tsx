import { Box, createStyles, Theme, WithStyles } from "@material-ui/core";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import withStyles from "@material-ui/core/styles/withStyles";
import { Alert } from "@material-ui/lab";
import { stopImpersonating } from "api/api";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { BasePage } from "pages/BasePage";
import React from "react";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import { KPanel } from "widgets/KPanel";

const styles = (theme: Theme) =>
  createStyles({
    large: {
      width: theme.spacing(9),
      height: theme.spacing(9),
    },
  });

interface Props extends WithStyles<typeof styles>, WithNamespaceProps, WithUserAuthProps {}

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

  private getApplicationRoles = () => {
    const { applications } = this.props;

    return applications
      .map((application) => {
        let role = "Owner";
        return { applicationName: application.name, role: role };
      })
      .filter((x) => !!x.role);
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
