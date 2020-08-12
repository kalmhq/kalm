import React from "react";
import { createStyles, Theme, withStyles, WithStyles, Grid } from "@material-ui/core";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { CertificateFormType, selfManaged } from "types/certificate";
import { createCertificateAction } from "actions/certificate";
// import { CertificateForm } from "forms/Certificate";
import { RootState } from "reducers";
import { BasePage } from "pages/BasePage";
import { H6 } from "widgets/Label";
import { push } from "connected-react-router";

const mapStateToProps = (state: RootState, ownProps: any) => {
  const certificate = state
    .get("certificates")
    .get("certificates")
    .find((certificate) => certificate.get("name") === ownProps.match.params.name);
  return {
    initialValues: certificate ? certificate.merge({ managedType: selfManaged }) : undefined,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

export interface Props extends WithStyles<typeof styles>, TDispatchProp, ReturnType<typeof mapStateToProps> {}

class CertificateEditRaw extends React.PureComponent<Props> {
  private submit = async (certificate: CertificateFormType) => {
    try {
      const { dispatch } = this.props;
      await dispatch(createCertificateAction(certificate, true));
    } catch (e) {
      console.log(e);
    }
  };

  private onSubmitSuccess = () => {
    this.props.dispatch(push("/certificates"));
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
            <Grid item xs={8} sm={8} md={8}>
              {/* <CertificateForm
                isEdit
                onSubmitSuccess={this.onSubmitSuccess}
                onSubmit={this.submit}
                initialValues={initialValues}
              /> */}
            </Grid>
          </Grid>
        </div>
      </BasePage>
    );
  }
}

export const CertificateEditPage = withStyles(styles)(connect(mapStateToProps)(CertificateEditRaw));
