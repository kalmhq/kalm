import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { BasePage } from "pages/BasePage";
import { AdminSidebar } from "pages/Admin/Sidebar";
import { Body, H4 } from "widgets/Label";
import { CustomizedButton } from "widgets/Button";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import { ReactComponent as SSOArchitecture } from "images/SSO.svg";
import { ReactComponent as SSOflow } from "images/sso-oidc-flow.svg";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class AdminSSOPageRaw extends React.PureComponent<Props, State> {
  private renderEmptyState() {
    return (
      <>
        <Body>
          The <strong>single sign-on</strong> feature allows you to configure access permissions for private components.
          Only users with the permissions you configured can access the resources behind. <br />
          Kalm can integrate with your existing user system, such as <strong>github</strong>, <strong>gitlab</strong>,{" "}
          <strong>google</strong>, etc.
        </Body>
        <Box mt={2}>
          <CustomizedButton variant="contained" color="primary" onClick={() => alert("Working in progress...")}>
            Enable Single Sign-on
          </CustomizedButton>
        </Box>
        <Box mt={2}>{this.renderLearnMoreInfo()}</Box>
      </>
    );
  }

  private renderLearnMoreInfo() {
    return (
      <>
        <CollapseWrapper title="Tell me more details about Kalm Single Sign-on feature." defaultOpen>
          <Box mt={2}>
            <H4>Standing on the shoulders of giants</H4>
            <Body>
              Kalm SSO solution is based on{" "}
              <a href="https://openid.net/connect/" rel="noopener noreferrer" target="_blank">
                OIDC
              </a>{" "}
              standard. It built on top of widely used components, such as{" "}
              <a href="https://istio.io/" rel="noopener noreferrer" target="_blank">
                Istio
              </a>
              ,{" "}
              <a href={"https://www.envoyproxy.io/"} target={"_blank"} rel={"noopener noreferrer"}>
                Envoy
              </a>{" "}
              and{" "}
              <a href={"https://github.com/dexidp/dex"} target={"_blank"} rel={"noopener noreferrer"}>
                dex
              </a>
              . Kalm use Istio CRDs to configure Envoy, add{" "}
              <a
                href={
                  "https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/filter/http/jwt_authn/v2alpha/config.proto"
                }
                target={"_blank"}
                rel={"noopener noreferrer"}
              >
                jwt_authn
              </a>
              ,{" "}
              <a
                href={
                  "https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/filter/http/ext_authz/v2/ext_authz.proto"
                }
                target={"_blank"}
                rel={"noopener noreferrer"}
              >
                ext_authz
              </a>{" "}
              filters for private endpoints. Dex acts as a portal to other identity providers.
            </Body>
          </Box>
          <Box mt={2}>
            <H4>Architecture</H4>
            <Body>
              The following picture shows the basic architecture of Kalm SSO. Two extra components will be installed in
              your cluster, AuthProxy and Dex. Any http traffic to your private component will be checked by auth proxy,
              if no valid authentication information is found, a redirect response will be returned to authenticate.
            </Body>
            <Box mt={2}>
              <SSOArchitecture />
            </Box>
          </Box>

          <Box mt={2}>
            <H4>The OIDC Flow</H4>
            <Body>The following chart describes how the whole authentication process works.</Body>
            <Box mt={2}>
              <SSOflow />
            </Box>
          </Box>
        </CollapseWrapper>
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

export const AdminSSOPage = withStyles(styles)(connect(mapStateToProps)(AdminSSOPageRaw));
