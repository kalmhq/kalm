import { Button, Grid } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { KFreeSoloAutoCompleteSingleValue, KFreeSoloAutoCompleteMultiValues } from "forms/Basic/autoComplete";
import { TextField } from "forms/Basic/text";
import { KRadioGroupRender } from "forms/Basic/radio";
import { ValidatorRequired } from "forms/validator";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { arrayPush, InjectedFormProps } from "redux-form";
import { Field, FieldArray, formValueSelector, getFormSyncErrors, reduxForm } from "redux-form/immutable";
import { TDispatchProp } from "types";
import { HttpsCertification } from "types/httpsCertification";
import { Certificate, CertificateFormType, issuerManaged, selfManaged, CertificateIssuerList } from "types/certificate";
import { setIsShowAddCertificateModal } from "actions/certificate";
import { RenderSelectField } from "forms/Basic/select";

const defaultFormID = "certificate";

const mapStateToProps = (state: RootState, { form }: OwnProps) => {
  const selector = formValueSelector(form || defaultFormID);
  const syncErrors = getFormSyncErrors(form || defaultFormID)(state) as { [key: string]: any };
  return {
    syncErrors,
    name: selector(state, "name") as string,
    managedType: selector(state, "managedType") as string,
    selfManagedCertContent: selector(state, "selfManagedCertContent") as string,
    selfManagedCertPrivateKey: selector(state, "selfManagedCertPrivateKey") as string,
    httpsCertIssuer: selector(state, "httpsCertIssuer") as string,
    certificateIssuers: state.get("certificates").get("certificateIssuer") as CertificateIssuerList,
    domains: selector(state, "domains") as Immutable.List<string>
  };
};

interface OwnProps {
  form?: string;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      "& .alert": {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1)
      }
    },
    fileInput: {}
  });

export interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp,
    InjectedFormProps<CertificateFormType> {}

interface State {}

class CertificateFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderSelfManagedFields = () => {
    const { classes } = this.props;
    return (
      <>
        <Grid item md={12}>
          <Field
            label="Certificate file"
            multiline={true}
            className={classes.fileInput}
            component={TextField}
            rows={12}
            name="selfManagedCertContent"
            margin="normal"
            validate={[ValidatorRequired]}
            options={[]}
          />
        </Grid>
        <Grid item md={12}>
          <Field
            label="Private key"
            multiline={true}
            className={classes.fileInput}
            component={TextField}
            rows={12}
            name="selfManagedCertPrivateKey"
            margin="normal"
            validate={[ValidatorRequired]}
            options={[]}
          />
        </Grid>
      </>
    );
  };

  private renderIssuerManagedFields = () => {
    const { classes, certificateIssuers } = this.props;
    return (
      <>
        <Grid item md={12}>
          <Field
            label="Domains"
            multiline={true}
            className={classes.fileInput}
            component={KFreeSoloAutoCompleteMultiValues}
            rows={12}
            name="domains"
            margin="normal"
            validate={[ValidatorRequired]}
            options={[]}
          />
        </Grid>
        <Grid item md={12}>
          <Field
            label="Certificate issuser"
            multiline={true}
            className={classes.fileInput}
            component={RenderSelectField}
            rows={12}
            name="httpsCertIssuer"
            margin="normal"
            validate={[ValidatorRequired]}
            options={Array.from(certificateIssuers)}
          />
        </Grid>
      </>
    );
  };

  public render() {
    const { classes, dispatch, handleSubmit, managedType } = this.props;

    return (
      <div className={classes.root}>
        <h2>Add Certificate</h2>
        <Grid container spacing={2}>
          <Grid item md={12}>
            <Field
              title=""
              component={KRadioGroupRender}
              name="managedType"
              options={[
                {
                  value: selfManaged,
                  label: "Upload an existing certificate"
                },
                {
                  value: issuerManaged,
                  label: "Apply a new certificate with certificate issuer"
                }
              ]}
            />
          </Grid>
          <Grid item md={12}>
            <Field
              label="Certificate name"
              component={TextField}
              name="name"
              margin="normal"
              validate={[ValidatorRequired]}
              options={[]}
            />
          </Grid>
          {managedType === selfManaged ? this.renderSelfManagedFields() : this.renderIssuerManagedFields()}
          <Grid container spacing={2}>
            <Grid item md={8}></Grid>
            <Grid item md={2}>
              <Button
                type="submit"
                onClick={() => dispatch(setIsShowAddCertificateModal(false))}
                color="primary"
                variant="contained">
                Cancel
              </Button>
            </Grid>
            <Grid item md={2}>
              <Button type="submit" onClick={handleSubmit} color="primary" variant="contained">
                Save
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export const CertificateForm = reduxForm<CertificateFormType, OwnProps>({
  onSubmitFail: console.log,
  form: defaultFormID,
  touchOnChange: true
})(connect(mapStateToProps)(withStyles(styles)(CertificateFormRaw)));
