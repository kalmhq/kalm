import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createCertificateAction } from "actions/certificate";
import { push } from "connected-react-router";
import { CertificateForm } from "forms/Certificate";
import { BasePage } from "pages/BasePage";
import React, { useState } from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { Certificate, CertificateFormType, newEmptyCertificateForm } from "types/certificate";
import { H6 } from "widgets/Label";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

export interface Props extends WithStyles<typeof styles>, TDispatchProp {}

const CertificateNewRaw: React.FC<Props> = (props) => {
  const [newCert, setNewCert] = useState<Certificate | null>(null);

  const submit = async (certificate: CertificateFormType) => {
    try {
      const { dispatch } = props;
      const cert = await dispatch(createCertificateAction(certificate, false));
      setNewCert(cert);
      onSubmitSuccess();
    } catch (e) {
      console.log(e);
    }
  };

  const onSubmitSuccess = () => {
    const { dispatch } = props;
    dispatch(push(`/certificates/${newCert?.name}`));
  };

  const { classes } = props;
  return (
    <BasePage secondHeaderRight={<H6>New Certificate</H6>}>
      <div className={classes.root}>
        <Grid container spacing={2}>
          <Grid item xs={8} sm={8} md={8}>
            <CertificateForm onSubmit={submit} initialValues={newEmptyCertificateForm} />
          </Grid>
        </Grid>
      </div>
    </BasePage>
  );
};

export const CertificateNewPage = withStyles(styles)(connect()(CertificateNewRaw));
