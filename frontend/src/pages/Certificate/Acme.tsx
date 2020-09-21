import { createStyles, Theme, withStyles, WithStyles, Grid, Box, Button } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps, Link } from "react-router-dom";
import { TDispatchProp } from "types";
import { Expansion } from "forms/Route/expansion";
import { RootState } from "reducers";
import { H6 } from "widgets/Label";
import { Loading } from "widgets/Loading";

const mapStateToProps = (state: RootState, ownProps: any) => {
  const acmeServer = state.certificates.acmeServer;
  return {
    acmeServer: acmeServer,
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
  });

export interface Props
  extends WithStyles<typeof styles>,
    RouteComponentProps,
    TDispatchProp,
    ReturnType<typeof mapStateToProps> {}

class CertificateAcmeRaw extends React.PureComponent<Props> {
  private renderAcmeServerGuide = () => {
    const { classes } = this.props;
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
        <Expansion title="ACME DNS Server is running" defaultUnfold>
          <Box p={2}>
            {acmeServer.ready ? (
              <Alert severity="success">Kalm DNS server is running well, you don't need to do any more.</Alert>
            ) : (
              <Alert severity="info">You simply need to do the following to get your DNS server up and running.</Alert>
            )}
            <>
              <Box p={1}>
                DNS Server Domain:
                <Box p={1}>
                  <Box mb={1}>NS Record:</Box>
                  <pre className={classes.action}>
                    {acmeServer.acmeDomain} NS {acmeServer.nsDomain}
                  </pre>
                </Box>
              </Box>
              <Box p={1}>
                Shadow Domain:
                <Box p={1}>
                  <Box mb={1}>A Record:</Box>
                  <pre className={classes.action}>
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
    );
  };

  public render() {
    const { classes } = this.props;
    return (
      <BasePage secondHeaderRight={<H6>ACME DNS Server</H6>}>
        <Box p={2}>
          <div className={classes.root}>
            <Grid container spacing={2}>
              <Grid item xs={8} sm={8} md={8}>
                {this.renderAcmeServerGuide()}
              </Grid>
            </Grid>
          </div>
        </Box>
      </BasePage>
    );
  }
}

export const CertificateAcmePage = withStyles(styles)(connect(mapStateToProps)(withRouter(CertificateAcmeRaw)));
