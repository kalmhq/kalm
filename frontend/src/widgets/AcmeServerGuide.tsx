import React from "react";
import { Box, Button, createStyles, Grid, Theme, withStyles } from "@material-ui/core";
import { WithStyles } from "@material-ui/styles";
import { Alert } from "@material-ui/lab";
import { Expansion } from "forms/Route/expansion";
import { AcmeServerInfo, Certificate, dns01Issuer } from "types/certificate";
import { Loading } from "./Loading";
import { Link } from "react-router-dom";
import { InfoBox } from "./InfoBox";
import { KLink } from "./Link";
import DomainStatus from "./DomainStatus";
import { FlexRowItemCenterBox } from "./Box";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";
import { CopyIcon } from "./Icon";
import copy from "copy-to-clipboard";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { setSuccessNotificationAction } from "actions/notification";

const styles = (_theme: Theme) =>
  createStyles({
    root: {},
  });

interface AcemServerGuideProps extends TDispatchProp, WithStyles<typeof styles> {
  acmeServer: AcmeServerInfo | null;
  cert?: Certificate | undefined;
  showPanel?: boolean;
}

export const AcmeServerGuide = connect()(
  withStyles(styles)((props: AcemServerGuideProps) => {
    const { acmeServer, cert, showPanel } = props;
    if (cert && cert.httpsCertIssuer !== dns01Issuer) {
      return null;
    }
    if (
      !acmeServer ||
      (acmeServer.acmeDomain.length === 0 &&
        acmeServer.ipForNameServer.length === 0 &&
        acmeServer.nsDomain.length === 0 &&
        !acmeServer.ready)
    ) {
      return (
        <Box p={2}>
          <Expansion title="ACME DNS Server" defaultUnfold>
            <Loading />
            Waiting for staring.
          </Expansion>
        </Box>
      );
    }

    const options = [
      {
        title: <KLink to="/acme">Check and config ACME DNS Server</KLink>,
        content: "",
      },
    ];

    return !acmeServer.ready || showPanel ? (
      <Box p={2}>
        <Expansion title="ACME DNS Server needs config" defaultUnfold>
          <Box p={2}>
            {acmeServer.ready ? (
              <Alert severity="info">
                In order to complete the verification and automatic renew of the wildcard certificate, an ACME dns
                server and udp loadbalancer will be installed on your cluster. Please follow the prompts and configure
                the following records in your DNS nameserver. Please note that this information is automatically
                generated based on your input. Read the documentation for more information.{" "}
                <KLink to={""}>[Learn More]</KLink>
              </Alert>
            ) : (
              <Alert severity="warning">Waiting for acme dns server launching.</Alert>
            )}
            <>
              <Box p={1}>DNS Server Domain:</Box>
              <Box p={1}>
                <DNSConfigGuide type={"NS"} domain={acmeServer.acmeDomain} nsRecord={acmeServer.nsDomain} />
              </Box>
              <Box p={1}>
                Shadow Domain:
                <Box p={1}>
                  <DNSConfigGuide domain={acmeServer.nsDomain} type="A" cnameRecord={acmeServer.ipForNameServer} />
                </Box>
              </Box>
              <Button color="primary" variant="outlined" size="small" component={Link} to={`/acme/edit`}>
                Edit
              </Button>
            </>
          </Box>
        </Expansion>
      </Box>
    ) : (
      <Box p={2}>
        <InfoBox title="ACME DNS Server is running" options={options}></InfoBox>
      </Box>
    );
  }),
);

const dnsConfigstyles = (_theme: Theme) =>
  createStyles({
    root: {},
    cell: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
    },
  });

interface DNSConfigGuideProps extends TDispatchProp, WithStyles<typeof dnsConfigstyles> {
  type: string;
  domain: string;
  nsRecord?: string;
  cnameRecord?: string;
  aRecord?: string;
}

export const DNSConfigGuide = connect()(
  withStyles(dnsConfigstyles)((props: DNSConfigGuideProps) => {
    const { domain, type, nsRecord, cnameRecord, aRecord, dispatch, classes } = props;
    const record = nsRecord || cnameRecord || aRecord || "";
    return (
      <Box justifyContent="center" display="flex" flexDirection="row" alignItems="center">
        <Grid container spacing={1}>
          <Grid item xs={1} sm={1} md={1} className={classes.cell}>
            <Box>Status</Box>
            <Box height={44} className={classes.cell}>
              <DomainStatus domain={domain} nsDomain={nsRecord} cnameDomain={cnameRecord} ipAddress={aRecord} />
            </Box>
          </Grid>
          <Grid item xs={1} sm={1} md={1} className={classes.cell}>
            <Box>Type</Box>
            <Box height={44} width={44} className={classes.cell}>
              {type}
            </Box>
          </Grid>
          <Grid item xs={5} sm={5} md={5} className={classes.cell}>
            <Box>Domain</Box>
            <FlexRowItemCenterBox>
              <Box textAlign="center">{domain}</Box>
              <IconButtonWithTooltip
                tooltipTitle="Copy"
                aria-label="copy"
                onClick={() => {
                  copy(domain);
                  dispatch(setSuccessNotificationAction("Copied successful!"));
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButtonWithTooltip>
            </FlexRowItemCenterBox>
          </Grid>
          <Grid item xs={5} sm={5} md={5} className={classes.cell}>
            <Box>Record</Box>
            <FlexRowItemCenterBox>
              <Box textAlign="center">{record}</Box>
              <IconButtonWithTooltip
                tooltipTitle="Copy"
                aria-label="copy"
                onClick={() => {
                  copy(record);
                  dispatch(setSuccessNotificationAction("Copied successful!"));
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButtonWithTooltip>
            </FlexRowItemCenterBox>
          </Grid>
        </Grid>
      </Box>
    );
  }),
);
