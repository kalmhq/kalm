import React from "react";
import { Box, Button, createStyles, Theme, withStyles } from "@material-ui/core";
import { WithStyles } from "@material-ui/styles";
import { Alert } from "@material-ui/lab";
import { Expansion } from "forms/Route/expansion";
import { AcmeServerInfo } from "types/certificate";
import { Loading } from "./Loading";
import { Link } from "react-router-dom";
import { Certificate, dns01Issuer } from "types/certificate";
import { InfoBox } from "./InfoBox";
import { KLink } from "./Link";

const styles = (_theme: Theme) =>
  createStyles({
    root: {},
    actionArea: {
      padding: _theme.spacing(1),
      borderRadius: 4,
      color: "#FFF",
      backgroundColor: "#000",
      overflowX: "auto",
    },
  });

interface AcemServerGuideProps extends WithStyles<typeof styles> {
  acmeServer: AcmeServerInfo | null;
  cert?: Certificate | undefined;
  showPanel?: boolean;
}

export const AcmeServerGuide = withStyles(styles)((props: AcemServerGuideProps) => {
  const { acmeServer, classes, cert, showPanel } = props;
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
      title: <KLink to="/acme">Check and config Kalm DNS Server</KLink>,
      content: "",
    },
  ];

  return !acmeServer.ready || showPanel ? (
    <Box p={2}>
      <Expansion title="Kalm DNS Server needs config" defaultUnfold>
        <Box p={2}>
          {acmeServer.ready ? (
            <Alert severity="success">Kalm DNS server is running well, you don't need to do any more.</Alert>
          ) : (
            <Alert severity="warning">You simply need to do the following to get your DNS server up and running.</Alert>
          )}
          <>
            <Box p={1}>
              DNS Server Domain:
              <Box p={1}>
                NS Record:
                <pre className={classes.actionArea}>
                  {acmeServer.acmeDomain} NS {acmeServer.nsDomain}
                </pre>
              </Box>
            </Box>
            <Box p={1}>
              Shadow Domain:
              <Box p={1}>
                A Record:
                <pre className={classes.actionArea}>
                  {acmeServer.nsDomain} A {acmeServer.ipForNameServer}
                </pre>
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
      <InfoBox title="Kalm DNS Server is running" options={options}></InfoBox>
    </Box>
  );
});
