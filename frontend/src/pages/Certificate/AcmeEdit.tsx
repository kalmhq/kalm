import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { goBack } from "connected-react-router";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { editAcmeServerAction } from "actions/certificate";
import { RootState } from "reducers";
import { AcmeServerFormType } from "types/certificate";
import { H6 } from "widgets/Label";
import { AcmeForm } from "forms/Certificate/acmeForm";

const mapStateToProps = (state: RootState, ownProps: any) => {
  const acmeServer = state.certificates.acmeServer;
  return {
    acmeServer: acmeServer,
    initialValues: {
      acmeDomain: acmeServer!.acmeDomain,
      nsDomain: acmeServer!.nsDomain,
    },
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

export interface Props extends WithStyles<typeof styles>, TDispatchProp, ReturnType<typeof mapStateToProps> {}

class CertificateAcmeEditRaw extends React.PureComponent<Props> {
  private submit = async (acmeServer: AcmeServerFormType) => {
    try {
      const { dispatch } = this.props;
      await dispatch(editAcmeServerAction(acmeServer));
      this.onSubmitSuccess();
    } catch (e) {
      console.log(e);
    }
  };
  private onSubmitSuccess = () => {
    const { dispatch } = this.props;
    dispatch(goBack());
  };

  public render() {
    const { initialValues, classes } = this.props;

    return (
      <BasePage secondHeaderRight={<H6>Edit ACME DNS Server</H6>}>
        <div className={classes.root}>
          <Grid container spacing={2}>
            <Grid item xs={8} sm={8} md={8}>
              <AcmeForm onSubmit={this.submit} initial={initialValues} />
            </Grid>
          </Grid>
        </div>
      </BasePage>
    );
  }
}

export const CertificateAcmeEditPage = withStyles(styles)(connect(mapStateToProps)(CertificateAcmeEditRaw));
