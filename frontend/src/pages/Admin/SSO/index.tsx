import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { BasePage } from "pages/BasePage";
import { AdminSidebar } from "pages/Admin/Sidebar";
import { Body, H6 } from "widgets/Label";
import { CustomizedButton } from "widgets/Button";
import { Link } from "react-router-dom";
import { SSOImplementDetails } from "pages/Admin/SSO/Details";
import { withSSO, WithSSOProps } from "hoc/withSSO";
import { Loading } from "widgets/Loading";
import { KPanel } from "widgets/KPanel";
import {
  ProtectedEndpoint,
  SSO_CONNECTOR_TYPE,
  SSO_CONNECTOR_TYPE_GITHUB,
  SSO_CONNECTOR_TYPE_GITLAB,
  SSOGithubConnector,
  SSOGitlabConnector,
} from "types/sso";
import { DeleteIcon, GithubIcon } from "widgets/Icon";
import Immutable from "immutable";
import { KTable } from "widgets/Table";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { deleteProtectedEndpointAction } from "actions/sso";
import { ProtectedEndpointForm } from "forms/ProtectedEndpoint";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithSSOProps {}

interface State {}

class AdminSSOPageRaw extends React.PureComponent<Props, State> {
  private renderConnectorDetails = (connector: SSOGitlabConnector | SSOGithubConnector) => {
    // @ts-ignore
    const type = connector.get("type") as SSO_CONNECTOR_TYPE;

    switch (type) {
      case SSO_CONNECTOR_TYPE_GITLAB: {
        const cnt = connector as SSOGitlabConnector;
        const baseURL = cnt.get("config").get("baseURL");
        const groups = cnt.get("config").get("groups") || Immutable.List();
        return (
          <Box key={cnt.get("id")} mt={2}>
            <H6>
              Gitlab {cnt.get("name")} (
              <a href={baseURL} target="_blank" rel="noopener noreferrer">
                {baseURL}
              </a>
              )
            </H6>
            Users in groups{" "}
            {groups
              .map((g, index) => (
                <>
                  <a target="_blank" rel="noopener noreferrer" href={baseURL + "/" + g}>
                    {g}
                  </a>
                  {index < cnt.get("config").get("groups").size - 1 ? ", " : " "}
                </>
              ))
              .toArray()}
          </Box>
        );
      }
      case SSO_CONNECTOR_TYPE_GITHUB: {
        const cnt = connector as SSOGithubConnector;
        return (
          <Box key={cnt.get("id")} mt={2}>
            <H6>
              <Box display="inline-block" style={{ verticalAlign: "middle" }} mr={1}>
                <GithubIcon />
              </Box>
              Github {cnt.get("name")}
            </H6>
            {cnt
              .get("config")
              .get("orgs")
              .map((org, index) => {
                const teams = org.get("teams");
                if (teams && teams.size > 0) {
                  return (
                    <Box key={org.get("name")}>
                      Users in organization {org.get("name")} and teams{" "}
                      {org.get("teams").map((team, index) => (
                        <>
                          <a target="_blank" rel="noopener noreferrer" href={"https://github.com/" + team}>
                            {team}
                          </a>
                          {index < teams.size - 1 ? ", " : " "}
                        </>
                      ))}
                    </Box>
                  );
                } else {
                  return <Box key={org.get("name")}>Users in organization {org.get("name")}</Box>;
                }
              })}
          </Box>
        );
      }
    }
  };

  private renderConfigDetails = () => {
    const { ssoConfig } = this.props;

    if (!ssoConfig) {
      return null;
    }

    return (
      <>
        <KPanel title={"Single Sign-on configuration Details"}>
          <Box p={2}>
            <pre>Dex OIDC Issuer: https://{ssoConfig.get("domain")}/dex</pre>
            {ssoConfig.get("connectors").map(this.renderConnectorDetails)}
          </Box>
        </KPanel>
        {this.renderProtectedComponents()}
      </>
    );
  };

  private renderNamespace = (rowData: ProtectedEndpoint) => {
    return rowData.get("namespace");
  };

  private renderComponentName = (rowData: ProtectedEndpoint) => {
    return rowData.get("endpointName");
  };

  private renderProtectedComponentAction = (rowData: ProtectedEndpoint) => {
    const { dispatch } = this.props;
    return (
      <IconButtonWithTooltip
        size="small"
        tooltipPlacement="top"
        tooltipTitle="Delete"
        aria-label="delete"
        onClick={() => dispatch(deleteProtectedEndpointAction(rowData))}
      >
        <DeleteIcon />
      </IconButtonWithTooltip>
    );
  };

  private renderProtectedComponents() {
    const { protectedEndpoints } = this.props;
    return (
      <Box mt={2}>
        <KPanel title="Protected Component">
          <Box p={2}>
            <Box mb={2}>
              <ProtectedEndpointForm />
            </Box>
            <KTable
              options={{
                paging: protectedEndpoints.size > 20,
              }}
              columns={[
                {
                  title: "Namespace",
                  field: "namespace",
                  sorting: false,
                  render: this.renderNamespace,
                },
                {
                  title: "component",
                  field: "component",
                  sorting: false,
                  render: this.renderComponentName,
                },
                { title: "Actions", field: "actions", sorting: false, render: this.renderProtectedComponentAction },
              ]}
              data={protectedEndpoints.toArray()}
            />
          </Box>
        </KPanel>
      </Box>
    );
  }

  private renderEmptyText = () => {
    return (
      <Body>
        The <strong>single sign-on</strong> feature allows you to configure access permissions for private components.
        Only users with the permissions you configured can access the resources behind. <br />
        Kalm SSO will integrate with your existing user system, such as <strong>github</strong>, <strong>gitlab</strong>
        , <strong>google</strong>, etc.
      </Body>
    );
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
          {!!ssoConfig ? this.renderConfigDetails() : this.renderEmptyText()}
          <Box mt={2} width={300}>
            <CustomizedButton component={Link} to="/admin/sso/config" variant="contained" color="primary">
              {ssoConfig ? "Update Single Sign-on Config" : "Enable Single Sign-on"}
            </CustomizedButton>
            {/*{loaded && ssoConfig ? <DangerButton>Delete Single Sign-On Config</DangerButton> : null}*/}
          </Box>
          <Box mt={2}>
            <SSOImplementDetails />
          </Box>
        </Box>
      </BasePage>
    );
  }
}

export const AdminSSOPage = withStyles(styles)(withSSO(AdminSSOPageRaw));
