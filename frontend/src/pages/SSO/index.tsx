import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import Alert from "@material-ui/lab/Alert/Alert";
import { setSuccessNotificationAction } from "actions/notification";
import { api } from "api";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { withSSO, WithSSOProps } from "hoc/withSSO";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { BasePage } from "pages/BasePage";
import React from "react";
import { Link } from "react-router-dom";
import {
  SSOGithubConnector,
  SSOGitlabConnector,
  SSO_CONNECTOR_TYPE,
  SSO_CONNECTOR_TYPE_GITHUB,
  SSO_CONNECTOR_TYPE_GITLAB,
} from "types/sso";
import sc from "utils/stringConstants";
import { CustomizedButton } from "widgets/Button";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { GithubIcon, SSOIcon } from "widgets/Icon";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KPanel } from "widgets/KPanel";
import { Body, Subtitle1 } from "widgets/Label";
import { KMLink } from "widgets/Link";
import { Loading } from "widgets/Loading";
const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithSSOProps, WithUserAuthProps, WithNamespaceProps {}

interface State {}

class SSOPageRaw extends React.PureComponent<Props, State> {
  private renderConnectorDetails = (connector: SSOGitlabConnector | SSOGithubConnector) => {
    const type = connector.type as SSO_CONNECTOR_TYPE;

    switch (type) {
      case SSO_CONNECTOR_TYPE_GITLAB: {
        const cnt = connector as SSOGitlabConnector;
        if (!cnt.config) {
          return null;
        }
        const baseURL = cnt.config.baseURL;
        const groups = cnt.config.groups || [];
        return (
          <Box key={cnt.id} mt={2}>
            <Subtitle1>
              Gitlab {cnt.name} (
              <KMLink href={baseURL} target="_blank" rel="noopener noreferrer">
                {baseURL}
              </KMLink>
              )
            </Subtitle1>
            Users in groups{" "}
            {groups.map((g, index) => (
              <React.Fragment key={index}>
                <KMLink target="_blank" rel="noopener noreferrer" href={baseURL + "/" + g}>
                  {g}
                </KMLink>
                {index < cnt.config.groups.length - 1 ? ", " : " "}
              </React.Fragment>
            ))}
          </Box>
        );
      }
      case SSO_CONNECTOR_TYPE_GITHUB: {
        const cnt = connector as SSOGithubConnector;
        return (
          <Box key={cnt.id} mt={2}>
            <Subtitle1>
              <Box display="inline-block" style={{ verticalAlign: "middle" }} mr={1}>
                <GithubIcon />
              </Box>
              Github {cnt.name}
            </Subtitle1>
            {cnt.config &&
              cnt.config.orgs.map((org) => {
                const teams = org.teams;
                if (teams && teams.length > 0) {
                  return (
                    <Box key={org.name}>
                      Users in organization {org.name} and teams{" "}
                      {org.teams.map((team, index) => (
                        <>
                          <a target="_blank" rel="noopener noreferrer" href={"https://github.com/" + team}>
                            {team}
                          </a>
                          {index < teams.length - 1 ? ", " : " "}
                        </>
                      ))}
                    </Box>
                  );
                } else {
                  return <Box key={org.name}>Users in organization {org.name}</Box>;
                }
              })}
          </Box>
        );
      }
    }
  };

  private deleteTemporaryUser = async () => {
    const { dispatch } = this.props;
    await api.deleteSSOTemporaryAdminUser();
    dispatch(setSuccessNotificationAction("The temporary admin user is successfully deleted."));
  };

  private renderConfigDetails = () => {
    const { ssoConfig, canEditCluster } = this.props;

    if (!ssoConfig) {
      return null;
    }

    return (
      <>
        <KPanel title={"Single Sign-on configuration Details"}>
          <Box p={2}>
            <pre>Dex OIDC Issuer: https://{ssoConfig.domain}/dex</pre>
            {ssoConfig.connectors && ssoConfig.connectors.map(this.renderConnectorDetails)}
          </Box>

          {canEditCluster() && (
            <>
              <Box p={2} display="inline-block">
                <CustomizedButton component={Link} size="small" to="/sso/config" variant="outlined" color="primary">
                  Edit
                </CustomizedButton>
              </Box>

              {ssoConfig.connectors && ssoConfig.connectors.length > 0 && !!ssoConfig.temporaryUser ? (
                <Box p={2} display="inline-block">
                  <Alert severity="info">
                    After you create connector in your Single Sign-on config, it's strongly recommended to delete your
                    temporary admin email account which is generated when you setup your cluster. Since the account
                    doesn't have expired time and doesn't support multi factor authentication, it's not safe for long
                    time usage.
                    <br />
                    Before the deletion, please test your new connector to confirm your settings are correct.
                  </Alert>
                  <Box mt={2}>
                    {" "}
                    <DeleteButtonWithConfirmPopover
                      useText
                      text="Delete Temporary Admin User"
                      popupId="delete-temporary-user"
                      popupTitle="Are your sure to delete temporary user?"
                      confirmedAction={this.deleteTemporaryUser}
                    />
                  </Box>
                </Box>
              ) : null}
            </>
          )}
        </KPanel>
      </>
    );
  };

  private renderEmptyText = () => {
    const { canEditCluster } = this.props;
    return (
      <Box>
        <Body>
          The <strong>single sign-on</strong> feature allows you to configure access permissions for private components.
          Only users with the permissions you configured can access the resources behind. <br />
          Kalm SSO will integrate with your existing user system, such as <strong>github</strong>,{" "}
          <strong>gitlab</strong>, <strong>google</strong>, etc.
        </Body>
        {canEditCluster() ? (
          <Box mt={2} width={300}>
            <CustomizedButton component={Link} to="/sso/config" variant="contained" color="primary">
              Enable Single Sign-on
            </CustomizedButton>
            {/*{loaded && ssoConfig ? <DangerButton>Delete Single Sign-On Config</DangerButton> : null}*/}
          </Box>
        ) : null}
      </Box>
    );
  };

  private renderEmpty() {
    const { canEditCluster } = this.props;
    return canEditCluster() ? (
      <EmptyInfoBox
        image={<SSOIcon style={{ height: 120, width: 120, color: grey[300] }} />}
        title={sc.EMPTY_SSO_TITLE}
        content={
          <>
            The <strong>single sign-on</strong> feature allows you to configure access permissions for private
            components. Only users with the permissions you configured can access the resources behind. <br />
            Kalm SSO will integrate with your existing user system, such as <strong>github</strong>,{" "}
            <strong>gitlab</strong>, <strong>google</strong>, etc.
          </>
        }
        button={
          <CustomizedButton component={Link} to="/sso/config" variant="contained" color="primary">
            Enable Single Sign-on
          </CustomizedButton>
        }
      />
    ) : null;
  }

  private renderInfoBox() {
    return (
      <InfoBox
        title="Reference"
        options={[
          {
            title: (
              <KMLink href="https://kalm.dev/docs/next/auth/sso" target="_blank">
                Single Sign-On Guide
              </KMLink>
            ),
            content: "",
          },
          {
            title: (
              <KMLink href="https://kalm.dev/docs/certs" target="_blank">
                How to add a new user?(TODO)
              </KMLink>
            ),
            draft: true,
            content: "",
          },
        ]}
      />
    );
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
        <Box p={2}>{!!ssoConfig ? this.renderConfigDetails() : this.renderEmpty()}</Box>
        <Box pb={2} pl={2} pr={2}>
          {this.renderInfoBox()}
        </Box>
      </BasePage>
    );
  }
}

export const SSOPage = withNamespace(withUserAuth(withStyles(styles)(withSSO(SSOPageRaw))));
