import { createStyles, Theme, withStyles, WithStyles, Grid, Box } from "@material-ui/core";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { TDispatchProp } from "types";
import { RootState } from "reducers";
import { H6 } from "widgets/Label";
import { AcmeServerGuide } from "widgets/AcmeServerGuide";

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
  public render() {
    const { classes, acmeServer } = this.props;
    return (
      <BasePage secondHeaderRight={<H6>ACME DNS Server</H6>}>
        <Box p={2}>
          <div className={classes.root}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12} md={12}>
                <AcmeServerGuide acmeServer={acmeServer} showPanel />
              </Grid>
            </Grid>
          </div>
        </Box>
      </BasePage>
    );
  }
}

export const CertificateAcmePage = withStyles(styles)(connect(mapStateToProps)(withRouter(CertificateAcmeRaw)));
