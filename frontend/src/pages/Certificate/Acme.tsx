import { Box, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { ACMEServer } from "widgets/ACMEServer";
import { H6 } from "widgets/Label";

const mapStateToProps = (state: RootState, ownProps: any) => {
  return {};
};

const styles = (theme: Theme) => createStyles({});

export interface Props
  extends WithStyles<typeof styles>,
    RouteComponentProps,
    TDispatchProp,
    ReturnType<typeof mapStateToProps> {}

const CertificateAcmeRaw: React.FC<Props> = (props) => {
  return (
    <BasePage secondHeaderRight={<H6>ACME DNS Server</H6>}>
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            <ACMEServer />
          </Grid>
        </Grid>
      </Box>
    </BasePage>
  );
};

export const CertificateAcmePage = withStyles(styles)(connect(mapStateToProps)(withRouter(CertificateAcmeRaw)));
