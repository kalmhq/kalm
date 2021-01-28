import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createCertificateAction } from "actions/certificate";
import { push } from "connected-react-router";
import { CertificateUploadForm } from "forms/Certificate/uploadForm";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { CertificateFormType, newEmptyCertificateUploadForm } from "types/certificate";
import { H6 } from "widgets/Label";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

export interface Props extends WithStyles<typeof styles>, TDispatchProp {}

const CertificateUploadRaw: React.FC<Props> = (props) => {
  const submit = async (certificate: CertificateFormType) => {
    try {
      const { dispatch } = props;
      await dispatch(createCertificateAction(certificate, false));
      onSubmitSuccess();
    } catch (e) {
      console.log(e);
    }
  };

  const onSubmitSuccess = () => {
    props.dispatch(push("/certificates"));
  };

  const { classes } = props;
  return (
    <BasePage secondHeaderRight={<H6>Upload Certificate</H6>}>
      <div className={classes.root}>
        <Grid container spacing={2}>
          <Grid item xs={8} sm={8} md={8}>
            <CertificateUploadForm onSubmit={submit} initialValues={newEmptyCertificateUploadForm} />
          </Grid>
        </Grid>
      </div>
    </BasePage>
  );
};

export const CertificateUploadPage = withStyles(styles)(connect()(CertificateUploadRaw));
