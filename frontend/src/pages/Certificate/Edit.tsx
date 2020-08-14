import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createCertificateAction } from "actions/certificate";
import { push } from "connected-react-router";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { CertificateFormTypeContent, selfManaged } from "types/certificate";
import { H6 } from "widgets/Label";
import { CertificateForm } from "forms/Certificate";

const mapStateToProps = (state: RootState, ownProps: any) => {
  const certificate = state
    .get("certificates")
    .get("certificates")
    .find((certificate) => certificate.get("name") === ownProps.match.params.name);
  return {
    initialValues: (certificate
      ? Object.assign(certificate.toJS(), { managedType: selfManaged, domains: certificate.get("domains") })
      : undefined) as CertificateFormTypeContent | undefined,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

export interface Props extends WithStyles<typeof styles>, TDispatchProp, ReturnType<typeof mapStateToProps> {}

class CertificateEditRaw extends React.PureComponent<Props> {
  private submit = async (certificate: CertificateFormTypeContent) => {
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
              <CertificateForm isEdit onSubmit={this.submit} initialValues={initialValues} />
            </Grid>
          </Grid>
        </div>
      </BasePage>
    );
  }
}

export const CertificateEditPage = withStyles(styles)(connect(mapStateToProps)(CertificateEditRaw));
