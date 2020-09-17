import React from "react";
import { createStyles, Theme, withStyles, WithStyles, Grid, Box, Button } from "@material-ui/core";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { Certificate, dns01Issuer, http01Issuer } from "types/certificate";
import { BasePage } from "pages/BasePage";
import { RootState } from "reducers";
import { withRouter, RouteComponentProps, Link } from "react-router-dom";
import { FlexRowItemCenterBox } from "widgets/Box";
import { KPanel } from "widgets/KPanel";
import { Alert } from "@material-ui/lab";
import DomainStatus, { acmePrefix } from "widgets/DomainStatus";
import { Expansion } from "forms/Route/expansion";
import { Loading } from "widgets/Loading";
import { CollapseWrapper } from "widgets/CollapseWrapper";
import { ResourceNotFound } from "widgets/ResourceNotFound";

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
          <Box>
            <Box className={classes.key}>Domains</Box>
            <Box pl={0} pt={1}>
              {domains?.map((domain) => {
                return (
                  <Box key={domain}>
                    <CollapseWrapper
                      title={
                        <FlexRowItemCenterBox>
                          <DomainStatus domain={domain} ipAddress={ingressIP} mr={1} />
                          {domain}
                        </FlexRowItemCenterBox>
                      }
                      showIcon={true}
                    >
                      <Box p={1}>
                        Add a A Record
                        <pre className={classes.action}>
                          {domain} A {ingressIP}{" "}
                        </pre>
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
                              <DomainStatus domain={acmePrefix + domain} nsDomain={ns} mr={1} />
                              {domain}
                            </FlexRowItemCenterBox>
                          }
                          defaultOpen={true}
                          showIcon={true}
                        >
                          <Box p={1}>
                            Add a NS Record
                            <pre className={classes.action}>
                              {acmePrefix}
                              {domain} NS {ns}{" "}
                            </pre>
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

  private renderAcmeServerGuide = (cert: Certificate | undefined) => {
    const { classes, location } = this.props;
    const coms = location.pathname.split("/");
    const certName = coms[coms.length - 1];
    if (cert === undefined) {
      return null;
    } else {
      if (cert.httpsCertIssuer !== dns01Issuer) {
        return null;
      } else {
        const { acmeServer } = this.props;
        if (acmeServer == null) {
          return (
            <Box p={2}>
              <Expansion title="ACME DNS Server" defaultUnfold>
                <Loading />
                Waiting for staring.
              </Expansion>
            </Box>
          );
        }

        return (
          <Box p={2}>
            <Expansion title="ACME DNS Server is running" defaultUnfold={!acmeServer.ready}>
              <Box p={2}>
                {acmeServer.ready ? (
                  <Alert severity="success">Kalm DNS server is running well, you don't need to do any more.</Alert>
                ) : (
                  <Alert severity="info">
                    You simply need to do the following to get your DNS server up and running.
                  </Alert>
                )}
                <>
                  <Box p={1}>
                    DNS Server Domain:
                    <Box p={1}>
                      NS Record:
                      <pre className={classes.action}>
                        {acmeServer.acmeDomain} NS {acmeServer.nsDomain}
                      </pre>
                    </Box>
                  </Box>
                  <Box p={1}>
                    Shadow Domain:
                    <Box p={1}>
                      A Record:
                      <pre className={classes.action}>
                        {acmeServer.nsDomain} A {acmeServer.ipForNameServer}
                      </pre>
                    </Box>
                  </Box>
                  <Button
                    color="primary"
                    variant="outlined"
                    size="small"
                    component={Link}
                    to={`/acme/edit?from=${certName}`}
                  >
                    Edit
                  </Button>
                </>
              </Box>
            </Expansion>
          </Box>
        );
      }
    }
  };
  public render() {
    const { classes, certificates, location, isLoading, isFirstLoaded } = this.props;
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
            ></ResourceNotFound>
          </Box>
        </BasePage>
      );
    }

    return (
      <BasePage>
        <div className={classes.root}>
          <Grid container spacing={2}>
            <Grid item xs={8} sm={8} md={8}>
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

              {this.renderAcmeServerGuide(certInfo)}
            </Grid>
          </Grid>
        </div>
      </BasePage>
    );
  }
}

export const CertificateDetailPage = withStyles(styles)(connect(mapStateToProps)(withRouter(CertificateDetailRaw)));
