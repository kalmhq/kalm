import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import { Alert, AlertTitle } from "@material-ui/lab";
import { deleteCertificateAction } from "actions/certificate";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { RootState } from "configureStore";
import { push } from "connected-react-router";
import { BasePage } from "pages/BasePage";
import { CertificateNotFound } from "pages/Certificate/NotFound";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { TDispatchProp } from "types";
import { Certificate, dns01Issuer, http01Issuer } from "types/certificate";
import { ACMEServer, DNSConfigItems } from "widgets/ACMEServer";
import { PendingBadge } from "widgets/Badge";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CodeBlock } from "widgets/CodeBlock";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { KPanel } from "widgets/KPanel";
import { DNS01ChallengeLink } from "widgets/Link";
import { Loading } from "widgets/Loading";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";

const mapStateToProps = (state: RootState) => {
  return {
    certificates: state.certificates.certificates,
    acmeServer: state.certificates.acmeServer,
    ingressIP: state.cluster.info.ingressIP || "---.---.---.---",
    isLoading: state.certificates.isLoading,
    isFirstLoaded: state.certificates.isFirstLoaded,
  };
};

const styles = (theme: Theme) => createStyles({});

export interface Props
  extends ReturnType<typeof mapStateToProps>,
    RouteComponentProps,
    WithStyles<typeof styles>,
    TDispatchProp {}

const CertificateDetailRaw: React.FC<Props> = (props) => {
  const renderDomainGuide = (cert: Certificate | undefined) => {
    const { ingressIP, acmeServer } = props;

    if (cert === undefined) {
      return null;
    }

    if (cert.httpsCertIssuer === http01Issuer) {
      const domains = cert.domains;
      return <DNSConfigItems items={domains?.map((domain) => ({ domain, type: "A", aRecord: ingressIP }))} />;
    }

    if (cert.httpsCertIssuer === dns01Issuer) {
      const domains = cert.wildcardCertDNSChallengeDomainMap;

      const warning = (
        <Box mb={2}>
          <Alert severity="warning">
            <AlertTitle>Your ACME DNS server is not ready yet.</AlertTitle>
            <Typography>
              <DNS01ChallengeLink /> requires your ACME DNS server working correctly. Please wait the server to start.
            </Typography>
          </Alert>
        </Box>
      );

      if (domains) {
        return (
          <>
            {!acmeServer || !acmeServer?.ready ? warning : null}
            <DNSConfigItems
              items={Object.keys(domains).map((domain) => ({
                domain: `_acme-challenge.${domain}`,
                type: "CNAME",
                cnameRecord: domains[domain],
              }))}
            />
          </>
        );
      } else {
        return warning;
      }
    }

    const domains = cert.domains;

    return (
      <>
        {domains?.map((domain) => {
          return <Box key={domain}>{domain}</Box>;
        })}
      </>
    );
  };

  const renderSecondaryHeader = () => {
    const { dispatch, location } = props;
    const coms = location.pathname.split("/");
    const certName = coms[coms.length - 1];

    return (
      <DeleteButtonWithConfirmPopover
        useText
        popupId="delete-certificate-popup"
        popupTitle="DELETE CERTIFICATE?"
        confirmedAction={async () => {
          try {
            await dispatch(deleteCertificateAction(certName));
            await dispatch(setSuccessNotificationAction(`Successfully deleted certificate '${certName}'`));
            dispatch(push("/certificates"));
          } catch {
            dispatch(setErrorNotificationAction());
          }
        }}
      />
    );
  };

  const renderStatus = (cert: Certificate) => {
    if (cert.ready === "True") {
      // why the ready field is a string value ?????
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox>Normal</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else if (!!cert.reason) {
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox mr={1}>
            <PendingBadge />
          </FlexRowItemCenterBox>
          <FlexRowItemCenterBox>{cert.reason}</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else {
      return <PendingBadge />;
    }
  };

  const renderLongWaitingHelper = () => {
    const { location, acmeServer, certificates } = props;
    const parts = location.pathname.split("/");
    const certName = parts[parts.length - 1];
    const cert = certificates.find((item) => item.name === certName);

    if (!cert || !acmeServer) {
      return null;
    }

    if (
      cert.isSelfManaged ||
      !cert.wildcardCertDNSChallengeDomainMap ||
      cert.httpsCertIssuer !== "default-dns01-issuer" ||
      cert.ready === "True"
    ) {
      return null;
    }

    const domains = cert.wildcardCertDNSChallengeDomainMap;

    if (Object.keys(domains).length === 0) {
      return null;
    }

    const challengeDomain = "_acme-challenge." + Object.keys(domains)[0];
    const acmeServerAddress = acmeServer.acmeDomain;
    const challengeDomainCNAME = Object.values(domains)[0];

    return (
      <Box p={2}>
        <CollapseWrapper title="The request is waiting for a long time, how to debug to understand what happened?">
          <Box mt={2}>
            <p>
              Follow the three steps below to locate the problem step by step. If you are able to see a random string
              that has 43 chars in "ANSWER SECTION" after a commend is executed in a shell environment, it means the
              step is configured correctly.
            </p>

            <p>1. Dig the challenge CNAME TXT record against your ACME DNS server.</p>
            <Box ml={2}>
              <CodeBlock>
                dig -t txt @{acmeServerAddress} {challengeDomainCNAME}
              </CodeBlock>
              <p>
                If the "ANSWER SECTION" is not found in this step. Usually it is your DNS query can't reach your ACME
                DNS server, or your ACME DNS server is not functioning normally.
              </p>
            </Box>
          </Box>
          <Box mt={2}>
            <p>2. Dig the challenge CNAME TXT record in a common network.</p>
            <Box ml={2}>
              <CodeBlock>dig -t txt {challengeDomainCNAME}</CodeBlock>
              <p>
                If the "ANSWER SECTION" is not found in this step. Usually it is you haven't correctly set NS and A
                record for your ACME DNS server. Please follow the instruction in ACME DNS server section below in this
                page.
              </p>
            </Box>
          </Box>
          <Box mt={2}>
            <p>3. Dig the challenge TXT record in a common network.</p>
            <Box ml={2}>
              <CodeBlock>dig -t txt {challengeDomain}</CodeBlock>
              <p>
                If the "ANSWER SECTION" is not found in this step. Usually it is the under challenging domain CNAME
                record is not correctly configure. Please follow the instruction in Domains section below in this page.
              </p>
            </Box>
          </Box>
        </CollapseWrapper>
      </Box>
    );
  };

  const { certificates, location, isLoading, isFirstLoaded } = props;
  if (isLoading && !isFirstLoaded) {
    return <Loading />;
  }

  const coms = location.pathname.split("/");
  const certName = coms[coms.length - 1];
  const certInfoList = certificates.filter((item) => item.name === certName);
  const cert = certInfoList[0];

  if (!cert) {
    return <CertificateNotFound />;
  }

  const isDNS01ChallengeType = !(!cert.isSelfManaged && cert.httpsCertIssuer === "default-http01-issuer");

  return (
    <BasePage secondHeaderRight={renderSecondaryHeader()}>
      <Box p={2}>
        {isDNS01ChallengeType && (
          <Box mt={2} mb={2}>
            <ACMEServer />
          </Box>
        )}

        <KPanel title="Certificate Info">
          <Box p={2}>
            <VerticalHeadTable
              items={[
                { name: "Name", content: certName },
                {
                  name: "Type",
                  content: cert?.isSelfManaged ? "Uploaded" : "Let's Encrypt",
                },
                {
                  name: "Challenge Type",
                  content: !isDNS01ChallengeType ? (
                    <BlankTargetLink href={"https://letsencrypt.org/docs/challenge-types/#http-01-challenge"}>
                      HTTP-01 challenge
                    </BlankTargetLink>
                  ) : (
                    <DNS01ChallengeLink />
                  ),
                },
                { name: "Status", content: renderStatus(cert) },
              ]}
            />
          </Box>

          {renderLongWaitingHelper()}
        </KPanel>

        <Box mt={2}>
          <KPanel title="Domains">
            <Box p={2}>{renderDomainGuide(cert)}</Box>
          </KPanel>
        </Box>
      </Box>
    </BasePage>
  );
};

export const CertificateDetailPage = withStyles(styles)(connect(mapStateToProps)(withRouter(CertificateDetailRaw)));
