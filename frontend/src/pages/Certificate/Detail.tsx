import React from "react";
import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { Certificate, dns01Issuer, http01Issuer } from "types/certificate";
import { BasePage } from "pages/BasePage";
import { RootState } from "reducers";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { KPanel } from "widgets/KPanel";
import { Loading } from "widgets/Loading";
import { ACMEServer, DNSConfigItems } from "widgets/ACMEServer";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { deleteCertificateAction } from "actions/certificate";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { push } from "connected-react-router";
import { CertificateNotFound } from "pages/Certificate/NotFound";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import { FlexRowItemCenterBox } from "widgets/Box";
import { PendingBadge } from "widgets/Badge";
import { BlankTargetLink } from "widgets/BlankTargetLink";
import { Alert, AlertTitle } from "@material-ui/lab";
import Typography from "@material-ui/core/Typography";
import { DNS01ChallengeLink } from "widgets/Link";

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

interface State {}

class CertificateDetailRaw extends React.PureComponent<Props, State> {
  private renderDomainGuide = (cert: Certificate | undefined) => {
    const { ingressIP, acmeServer } = this.props;

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
              items={Object.keys(domains).map((domain) => ({ domain, type: "NS", cnameRecord: domains[domain] }))}
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

  private renderSecondaryHeader() {
    const { dispatch, location } = this.props;
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
  }

  private renderStatus = (cert: Certificate) => {
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

  public render() {
    const { certificates, location, isLoading, isFirstLoaded } = this.props;
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

    return (
      <BasePage secondHeaderRight={this.renderSecondaryHeader()}>
        <Box p={2}>
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
                    content:
                      !cert.isSelfManaged && cert.httpsCertIssuer === "default-http01-issuer" ? (
                        <BlankTargetLink href={"https://letsencrypt.org/docs/challenge-types/#http-01-challenge"}>
                          HTTP-01 challenge
                        </BlankTargetLink>
                      ) : (
                        <DNS01ChallengeLink />
                      ),
                  },
                  { name: "Status", content: this.renderStatus(cert) },
                ]}
              />
            </Box>
          </KPanel>

          <Box mt={2}>
            <KPanel title="Domains">
              <Box p={2}>{this.renderDomainGuide(cert)}</Box>
            </KPanel>
          </Box>

          <Box mt={2}>
            <ACMEServer />
          </Box>
        </Box>
      </BasePage>
    );
  }
}

export const CertificateDetailPage = withStyles(styles)(connect(mapStateToProps)(withRouter(CertificateDetailRaw)));
