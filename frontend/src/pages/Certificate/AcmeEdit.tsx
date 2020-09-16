import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { createCertificateAction } from "actions/certificate";
import { RootState } from "reducers";
import { CertificateFormTypeContent } from "types/certificate";
import { H6 } from "widgets/Label";

const mapStateToProps = (state: RootState, ownProps: any) => {
  return {
    acmeServer: state.get("certificates").get("acmeServer"),
    initialValues: {
      acmeDomain: "",
      nsDomain: "",
    },
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

export interface Props extends WithStyles<typeof styles>, TDispatchProp, ReturnType<typeof mapStateToProps> {}

class CertificateAcmeEditRaw extends React.PureComponent<Props> {
  private submit = async (certificate: CertificateFormTypeContent) => {
    try {
      const { dispatch } = this.props;
      await dispatch(createCertificateAction(certificate, true));
      dispatch(push("/certificates"));
    } catch (e) {
      console.log(e);
    }
  };

  public render() {
    const { initialValues, classes } = this.props;
    if (!initialValues) {
      return "Certificate not found";
    }

    return (
      <BasePage secondHeaderRight={<H6>New Certificate</H6>}>
        <div className={classes.root}>
          <Grid container spacing={2}>
            <Grid item xs={8} sm={8} md={8}></Grid>
          </Grid>
        </div>
      </BasePage>
    );
  }
}

export const CertificateAcmeEditPage = withStyles(styles)(connect(mapStateToProps)(CertificateAcmeEditRaw));
