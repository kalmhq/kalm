import { Button, Grid, Paper } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { Field, FormikProps, withFormik } from "formik";
import { RenderFormikSelectField } from "forms/Basic/select";
import { KRenderDebounceFormikTextField } from "forms/Basic/textfield";
import { ValidatorRequired } from "forms/validator";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { caForTest, CertificateIssuerFormType, cloudFlare } from "types/certificate";

interface OwnProps {
  form?: string;
  isEdit?: boolean;
  _initialValues: CertificateIssuerFormType;
  onSubmit: (formValues: CertificateIssuerFormType) => void;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    paper: {
      background: grey[50],
      padding: theme.spacing(2),
      margin: 8,
      width: "100%",
    },
  });

export interface Props
  extends WithStyles<typeof styles>,
    OwnProps,
    TDispatchProp,
    FormikProps<CertificateIssuerFormType> {
  isEdit?: boolean;
}

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
            component={KRenderDebounceFormikTextField}
            name="acmeCloudFlare.account"
            margin="normal"
            validate={ValidatorRequired}
          />
        </Grid>
        <Grid item md={12}>
          <Field
            label="Token Secret"
            component={KRenderDebounceFormikTextField}
            name="acmeCloudFlare.secret"
            margin="normal"
            validate={ValidatorRequired}
          />
        </Grid>
      </>
    );
  };

  public render() {
    const { classes, handleSubmit, values, isEdit } = this.props;

    return (
      <Paper square className={classes.paper} elevation={0}>
        <Grid container spacing={2}>
          {isEdit ? null : (
            <Grid item md={12}>
              <Field
                label="Issuer Type"
                component={RenderFormikSelectField}
                name="issuerType"
                margin="normal"
                validate={ValidatorRequired}
                options={[
                  { value: cloudFlare, text: "Cloudflare" },
                  { value: caForTest, text: "CA for test" },
                ]}
              ></Field>
            </Grid>
          )}
          {isEdit ? null : (
            <Grid item md={12}>
              <Field
                label="Issuer name"
                component={KRenderDebounceFormikTextField}
                name="name"
                margin="normal"
                validate={ValidatorRequired}
              />
            </Grid>
          )}
          {values.issuerType === cloudFlare ? this.renderCloudflareFields() : null}
          <Grid container spacing={2}>
            <Grid item md={10}></Grid>
            <Grid item md={2}>
              <Button
                type="submit"
                onClick={(event: any) => {
                  handleSubmit(event);
                }}
                color="primary"
              >
                {isEdit ? "Save" : "Create"}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    );
  }
}

export const CertificateIssuerForm = withFormik<Props, CertificateIssuerFormType>({
  mapPropsToValues: (props) => props._initialValues,
  enableReinitialize: true,
  handleSubmit: async (formValues, { props: { onSubmit } }) => {
    await onSubmit(formValues);
  },
})(connect()(withStyles(styles)(CertificateIssuerFormRaw)));
