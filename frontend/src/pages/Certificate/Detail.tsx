import React from "react";
import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { Certificate, dns01Issuer, http01Issuer } from "types/certificate";
import { BasePage } from "pages/BasePage";
import { RootState } from "reducers";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { KPanel } from "widgets/KPanel";
import DomainStatus, { acmePrefix } from "widgets/DomainStatus";
import { Loading } from "widgets/Loading";
import { AcmeServerGuide, DNSConfigGuide } from "widgets/AcmeServerGuide";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { deleteCertificateAction } from "actions/certificate";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { push } from "connected-react-router";
import { CertificateNotFound } from "pages/Certificate/NotFound";
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

interface State {}

class CertificateDetailRaw extends React.PureComponent<Props, State> {
  private renderDomainGuide = (cert: Certificate | undefined) => {
    const { ingressIP, acmeServer } = this.props;

    if (cert === undefined) {
      return null;
    } else {
      if (cert.httpsCertIssuer === http01Issuer) {
        const domains = cert.domains;
        return (
          <>
            {domains?.map((domain) => {
              return <DNSConfigGuide domain={domain} type="A" aRecord={ingressIP} />;
            })}
          </>
        );
      } else if (cert.httpsCertIssuer === dns01Issuer) {
        if (!acmeServer || !acmeServer.ready) {
          const domains = cert.domains;
          return (
            <>
              {domains?.map((domain) => {
                return <DomainStatus domain={acmePrefix + domain} cnameDomain={""} mr={1} />;
              })}
            </>
          );
        } else {
          const domains = cert.wildcardCertDNSChallengeDomainMap;
          if (domains) {
            return (
              <>
                {Object.keys(domains).map((domain: string) => {
                  const ns = domains[domain];
                  return (
                    <Box key={domain}>
                      <DNSConfigGuide domain={domain} type="NS" cnameRecord={ns} />
                    </Box>
                  );
                })}
              </>
            );
          }
        }
      } else {
        const domains = cert.domains;

        return (
          <>
            {domains?.map((domain) => {
              return <Box key={domain}>{domain}</Box>;
            })}
          </>
        );
      }
    }
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
            dispatch(push("/certifications"));
          } catch {
            dispatch(setErrorNotificationAction());
          }
        }}
      />
    );
  }

  public render() {
    const { certificates, location, isLoading, isFirstLoaded, acmeServer } = this.props;
    if (isLoading && !isFirstLoaded) {
      return <Loading />;
    }

    const coms = location.pathname.split("/");
    const certName = coms[coms.length - 1];
    const certInfoList = certificates.filter((item) => item.name === certName);
    const certInfo = certInfoList[0];

    if (!certInfo) {
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
                    content: certInfo?.isSelfManaged ? "Externally Uploaded" : certInfo?.httpsCertIssuer,
                  },
                  { name: "Status", content: certInfo?.ready ? certInfo?.ready : "Not Ready" },
                ]}
              />
            </Box>
          </KPanel>

          <Box mt={2}>
            <KPanel title="Domains">
              <Box p={2}>{this.renderDomainGuide(certInfo)}</Box>
            </KPanel>
          </Box>
        </Box>

        <AcmeServerGuide acmeServer={acmeServer} cert={certInfo} />
      </BasePage>
    );
  }
}

export const CertificateDetailPage = withStyles(styles)(connect(mapStateToProps)(withRouter(CertificateDetailRaw)));
