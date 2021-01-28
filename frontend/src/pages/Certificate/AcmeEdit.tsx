import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { editAcmeServerAction } from "actions/certificate";
import { push } from "connected-react-router";
import { AcmeForm } from "forms/Certificate/acmeForm";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { AcmeServerFormType } from "types/certificate";
import { H6 } from "widgets/Label";

const mapStateToProps = (state: RootState, ownProps: any) => {
  const acmeServer = state.certificates.acmeServer;
  const initialValues = acmeServer
    ? {
        acmeDomain: acmeServer.acmeDomain,
        nsDomain: acmeServer.nsDomain,
      }
    : {
        acmeDomain: "",
        nsDomain: "",
      };
  return {
    acmeServer: acmeServer,
    initialValues: initialValues,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

export interface Props
  extends WithStyles<typeof styles>,
    RouteComponentProps,
    TDispatchProp,
    ReturnType<typeof mapStateToProps> {}

const CertificateAcmeEditRaw: React.FC<Props> = (props) => {
  const submit = async (acmeServer: AcmeServerFormType) => {
    try {
      const { dispatch } = props;
      await dispatch(editAcmeServerAction(acmeServer));
      onSubmitSuccess();
    } catch (e) {
      console.log(e);
    }
  };
  const onSubmitSuccess = () => {
    const { dispatch, location } = props;
    const coms = location.search.replace("?", "").split("=");
    const target = coms[coms.length - 1];
    dispatch(push("/certificates/" + target));
  };

  const { initialValues, classes } = props;
  return (
    <BasePage secondHeaderRight={<H6>Edit ACME DNS Server</H6>}>
      <div className={classes.root}>
        <Grid container spacing={2}>
          <Grid item xs={8} sm={8} md={8}>
            <AcmeForm onSubmit={submit} initial={initialValues} />
          </Grid>
        </Grid>
      </div>
    </BasePage>
  );
};

export const CertificateAcmeEditPage = withStyles(styles)(connect(mapStateToProps)(withRouter(CertificateAcmeEditRaw)));
