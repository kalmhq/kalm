import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createCertificateAction } from "actions/certificate";
import { push } from "connected-react-router";
import { CertificateUploadForm } from "forms/Certificate/uploadForm";
import produce from "immer";
import { BasePage } from "pages/BasePage";
import { CertificateNotFound } from "pages/Certificate/NotFound";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { CertificateFormType, selfManaged } from "types/certificate";
import { H6 } from "widgets/Label";
import { Loading } from "widgets/Loading";

const mapStateToProps = (state: RootState, ownProps: any) => {
  const certificate = state.certificates.certificates.find(
    (certificate) => certificate.name === ownProps.match.params.name,
  );

  return {
    initialValues: (certificate
      ? produce(certificate, (draft: CertificateFormType) => {
          draft.managedType = selfManaged;
        })
      : undefined) as CertificateFormType | undefined,
    isLoading: state.certificates.isLoading,
    isFirstLoaded: state.certificates.isFirstLoaded,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

export interface Props extends WithStyles<typeof styles>, TDispatchProp, ReturnType<typeof mapStateToProps> {}

const CertificateEditRaw: React.FC<Props> = (props) => {
  const submit = async (certificate: CertificateFormType) => {
    try {
      const { dispatch } = props;
      await dispatch(createCertificateAction(certificate, true));
      dispatch(push("/certificates"));
    } catch (e) {
      console.log(e);
    }
  };

  const { initialValues, classes, isLoading, isFirstLoaded } = props;
  if (isLoading && !isFirstLoaded) {
    return <Loading />;
  }

  if (!initialValues) {
    return <CertificateNotFound />;
  }

  return (
    <BasePage secondHeaderRight={<H6>Edit Certificate</H6>}>
      <div className={classes.root}>
        <Grid container spacing={2}>
          <Grid item xs={8} sm={8} md={8}>
            <CertificateUploadForm isEdit onSubmit={submit} initialValues={initialValues} />
          </Grid>
        </Grid>
      </div>
    </BasePage>
  );
};

export const CertificateEditPage = withStyles(styles)(connect(mapStateToProps)(CertificateEditRaw));
