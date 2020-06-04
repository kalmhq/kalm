import { Button, Grid, MenuItem, Paper } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { TextField } from "forms/Basic/text";
import { ValidatorRequired } from "forms/validator";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { InjectedFormProps } from "redux-form";
import { Field, formValueSelector, getFormSyncErrors, reduxForm } from "redux-form/immutable";
import { TDispatchProp } from "types";
import { CertificateIssuerFormType, AcmeCloudFlare, cloudFlare, caForTest } from "types/certificate";
import { RenderSelectField } from "forms/Basic/select";
import { grey } from "@material-ui/core/colors";

const defaultFormID = "certificate-issuer";

const mapStateToProps = (state: RootState, { form }: OwnProps) => {
  const selector = formValueSelector(form || defaultFormID);
  const syncErrors = getFormSyncErrors(form || defaultFormID)(state) as { [key: string]: any };
  return {
    syncErrors,
    name: selector(state, "name") as string,
    issuerType: selector(state, "issuerType") as string,
    caForTest: selector(state, "caForTest") as {} | undefined,
    acmeCloudFlare: selector(state, "acmeCloudFlare") as AcmeCloudFlare | undefined
  };
};

interface OwnProps {
  form?: string;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    paper: {
      background: grey[50],
      padding: 20,
      margin: 8,
      width: "100%"
    }
  });

export interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp,
    InjectedFormProps<CertificateIssuerFormType> {}

interface State {}

class CertificateIssuerFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderCloudflareFields = () => {
    return (
      <>
        <Grid item md={12}>
          <Field
            label="Email"
            component={TextField}
            name="acmeCloudFlare.email"
            margin="normal"
            validate={[ValidatorRequired]}
          />
        </Grid>
        <Grid item md={12}>
          <Field
            label="Token Secret"
            component={TextField}
            name="acmeCloudFlare.apiTokenSecretName"
            margin="normal"
            validate={[ValidatorRequired]}
          />
        </Grid>
      </>
    );
  };

  public render() {
    const { classes, handleSubmit, issuerType } = this.props;

    return (
      <Paper square className={classes.paper} elevation={0}>
        <Grid container spacing={2}>
          <Grid item md={12}>
            <Field
              label="Issuer Type"
              component={RenderSelectField}
              name="issuerType"
              margin="normal"
              validate={[ValidatorRequired]}>
              <MenuItem value={cloudFlare}>Cloudflare</MenuItem>
              <MenuItem value={caForTest}>CA for test</MenuItem>
            </Field>
          </Grid>
          <Grid item md={12}>
            <Field
              label="Issuer name"
              component={TextField}
              name="name"
              margin="normal"
              validate={[ValidatorRequired]}
            />
          </Grid>
          {issuerType === cloudFlare ? this.renderCloudflareFields() : null}
          <Grid container spacing={2}>
            <Grid item md={10}></Grid>
            <Grid item md={2}>
              <Button type="submit" onClick={handleSubmit} color="primary">
                Create
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    );
  }
}

export const CertificateIssuerForm = reduxForm<CertificateIssuerFormType, OwnProps>({
  onSubmitFail: console.log,
  form: defaultFormID,
  touchOnChange: true
})(connect(mapStateToProps)(withStyles(styles)(CertificateIssuerFormRaw)));
