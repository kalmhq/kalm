import React from "react";
import { Box, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { Certificate, dns01Issuer, http01Issuer } from "types/certificate";
import { BasePage } from "pages/BasePage";
import { RootState } from "reducers";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { FlexRowItemCenterBox } from "widgets/Box";
import { KPanel } from "widgets/KPanel";
import DomainStatus, { acmePrefix } from "widgets/DomainStatus";
import { Loading } from "widgets/Loading";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import { ResourceNotFound } from "widgets/ResourceNotFound";
import { AcmeServerGuide, DNSConfigGuide } from "widgets/AcmeServerGuide";

const mapStateToProps = (state: RootState) => {
  return {
    certificates: state.certificates.certificates,
    acmeServer: state.certificates.acmeServer,
    ingressIP: state.cluster.info.ingressIP || "---.---.---.---",
    isLoading: state.certificates.isLoading,
    isFirstLoaded: state.certificates.isFirstLoaded,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    action: {
      padding: theme.spacing(1),
      borderRadius: 4,
      color: "#FFF",
      backgroundColor: "#000",
      overflowX: "auto",
    },
    key: {
      width: 60,
    },
  });

export interface Props
  extends ReturnType<typeof mapStateToProps>,
    RouteComponentProps,
    WithStyles<typeof styles>,
    TDispatchProp {}

interface State {}

class CertificateDetailRaw extends React.PureComponent<Props, State> {
  private renderDomainGuide = (cert: Certificate | undefined) => {
    const { classes, ingressIP, acmeServer } = this.props;
    if (cert === undefined) {
      return null;
    } else {
      if (cert.httpsCertIssuer === http01Issuer) {
        const domains = cert.domains;
        return (
          <Box mt={1}>
            <Box className={classes.key}>Domains</Box>
            <Box pl={0} pt={1}>
              {domains?.map((domain) => {
                return (
                  <Box key={domain}>
                    <CollapseWrapper
                      title={
                        <FlexRowItemCenterBox>
                          {/* <DomainStatus domain={domain} ipAddress={ingressIP} mr={1} /> */}
                          {domain}
                        </FlexRowItemCenterBox>
                      }
                      showIcon={true}
                      defaultOpen={true}
                    >
                      <Box p={1}>
                        <Box mb={1}>Add a A Record</Box>
                        <DNSConfigGuide domain={domain} type="A" aRecord={ingressIP} />
                      </Box>
                    </CollapseWrapper>
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      } else if (cert.httpsCertIssuer === dns01Issuer) {
        if (!acmeServer || !acmeServer.ready) {
          const domains = cert.domains;
          return (
            <Box>
              <Box className={classes.key}>Domains</Box>
              <Box pl={0} pt={1}>
                {domains?.map((domain) => {
                  return (
                    <FlexRowItemCenterBox key={domain}>
                      <DomainStatus domain={acmePrefix + domain} cnameDomain={""} mr={1} />
                      {domain}
                    </FlexRowItemCenterBox>
                  );
                })}
              </Box>
            </Box>
          );
        } else {
          const domains = cert.wildcardCertDNSChallengeDomainMap;
          if (domains) {
            return (
              <Box>
                <Box className={classes.key}>Domains</Box>
                <Box pl={0} pt={1}>
                  {Object.keys(domains).map((domain: string) => {
                    const ns = domains[domain];
                    return (
                      <Box key={domain}>
                        <CollapseWrapper
                          title={
                            <FlexRowItemCenterBox>
                              {/* <DomainStatus domain={acmePrefix + domain} cnameDomain={ns} mr={1} /> */}
                              {domain}
                            </FlexRowItemCenterBox>
                          }
                          defaultOpen={true}
                          showIcon={true}
                        >
                          <Box p={1}>
                            <Box mb={1}>Add a CNAME Record</Box>
                            <DNSConfigGuide domain={domain} type="NS" cnameRecord={ns} />
                          </Box>
                        </CollapseWrapper>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          }
        }
      } else {
        const domains = cert.domains;
        return (
          <Box>
            <Box className={classes.key}>Domains</Box>
            <Box pl={10} pt={1}>
              {domains?.map((domain) => {
                return (
                  <Box key={domain}>
                    <FlexRowItemCenterBox>{domain}</FlexRowItemCenterBox>
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      }
    }
  };

  public render() {
    const { classes, certificates, location, isLoading, isFirstLoaded, acmeServer } = this.props;
    if (isLoading && !isFirstLoaded) {
      return <Loading />;
    }

    const coms = location.pathname.split("/");
    const certName = coms[coms.length - 1];
    const certInfoList = certificates.filter((item) => item.name === certName);
    const certInfo = certInfoList[0];

    if (!certInfo) {
      return (
        <BasePage>
          <Box p={2}>
            <ResourceNotFound
              text="Certificate not found"
              redirect={`/applications`}
              redirectText="Go back to Apps List"
            />
          </Box>
        </BasePage>
      );
    }

    return (
      <BasePage>
        <div className={classes.root}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12} md={12}>
              <Box p={2}>
                <KPanel title="Certificate Info">
                  <Box p={2}>
                    <FlexRowItemCenterBox>
                      <Box className={classes.key}>Name</Box>
                      <Box pl={2} />
                      {certName}
                    </FlexRowItemCenterBox>
                    <FlexRowItemCenterBox>
                      <Box className={classes.key}>Type</Box>
                      <Box pl={2} />
                      {certInfo?.isSelfManaged ? "Externally Uploaded" : certInfo?.httpsCertIssuer}
                    </FlexRowItemCenterBox>

                    <FlexRowItemCenterBox>
                      <Box className={classes.key}>Status</Box>
                      <Box pl={2} />
                      {certInfo?.ready ? certInfo?.ready : "Not Ready"}
                    </FlexRowItemCenterBox>

                    {this.renderDomainGuide(certInfo)}
                  </Box>
                </KPanel>
              </Box>
              <AcmeServerGuide acmeServer={acmeServer} cert={certInfo} />
            </Grid>
          </Grid>
        </div>
      </BasePage>
    );
  }
}

export const CertificateDetailPage = withStyles(styles)(connect(mapStateToProps)(withRouter(CertificateDetailRaw)));
