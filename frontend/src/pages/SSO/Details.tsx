import { Box } from "@material-ui/core";
import { Body, H4 } from "widgets/Label";
import { ReactComponent as SSOArchitecture } from "images/SSO.svg";
import { ReactComponent as SSOFlow } from "images/sso-oidc-flow.svg";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import React from "react";

export const SSOImplementDetails = () => {
  return (
    <CollapseWrapper title="Tell me more details about Kalm Single Sign-on feature.">
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
            href={"https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/filter/http/ext_authz/v2/ext_authz.proto"}
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
          The following picture shows the basic architecture of Kalm SSO. Two extra components will be installed in your
          cluster, AuthProxy and Dex. Any http traffic to your private component will be checked by auth proxy, if no
          valid authentication information is found, a redirect response will be returned to authenticate.
        </Body>
        <Box mt={2}>
          <SSOArchitecture />
        </Box>
      </Box>

      <Box mt={2}>
        <H4>The OIDC Flow</H4>
        <Body>The following chart describes how the whole authentication process works.</Body>
        <Box mt={2}>
          <SSOFlow />
        </Box>
      </Box>
    </CollapseWrapper>
  );
};
