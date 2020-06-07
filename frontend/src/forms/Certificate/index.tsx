import { Button, Grid } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { createCertificateIssuerAction, setIsShowAddCertificateModal } from "actions/certificate";
import { KFreeSoloAutoCompleteMultiValues } from "forms/Basic/autoComplete";
import { KRadioGroupRender } from "forms/Basic/radio";
import { RenderSelectField } from "forms/Basic/select";
import { KRenderTextField } from "forms/Basic/textfield";
import { ValidatorRequired } from "forms/validator";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { InjectedFormProps } from "redux-form";
import { Field, formValueSelector, getFormSyncErrors, reduxForm } from "redux-form/immutable";
import { TDispatchProp } from "types";
import {
  CertificateFormType,
  CertificateIssuerFormType,
  CertificateIssuerList,
  issuerManaged,
  newEmptyCertificateIssuerForm,
  selfManaged
} from "types/certificate";
import { CertificateIssuerForm } from "./issuerForm";
import { Uploader } from "forms/Basic/uploader";

const defaultFormID = "certificate";
const createIssuer = "createIssuer";

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
    certificateIssuers: state.get("certificates").get("certificateIssuers") as CertificateIssuerList,
    domains: selector(state, "domains") as Immutable.List<string>
  };
};

interface OwnProps {
  form?: string;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {},
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

  private submitCreateIssuer = async (certificateIssuer: CertificateIssuerFormType) => {
    const { dispatch, change } = this.props;
    try {
      await dispatch(createCertificateIssuerAction(certificateIssuer));
      change("httpsCertIssuer", certificateIssuer.get("name"));
      dispatch(setIsShowAddCertificateModal(false));
    } catch (e) {
      console.log(e);
    }
  };

  private renderSelfManagedFields = () => {
    const { classes } = this.props;
    return (
      <>
        <Grid item md={12}>
          <Field
            inputlabel="Certificate file"
            inputid="upload-certificate"
            multiline={true}
            className={classes.fileInput}
            component={Uploader}
            rows={12}
            name="selfManagedCertContent"
            margin="normal"
            validate={[ValidatorRequired]}
          />
        </Grid>
        <Grid item md={12}>
          <Field
            inputlabel="Private Key"
            inputid="upload-private-key"
            multiline={true}
            className={classes.fileInput}
            component={Uploader}
            rows={12}
            name="selfManagedCertPrivateKey"
            margin="normal"
            validate={[ValidatorRequired]}
          />
        </Grid>
      </>
    );
  };

  private renderIssuerManagedFields = () => {
    const { classes, certificateIssuers, httpsCertIssuer } = this.props;

    const httpsCertIssuerOptions = [
      {
        value: createIssuer,
        text: "Add new certificate issuer"
      }
    ];
    certificateIssuers.forEach(certificateIssuer => {
      const name = certificateIssuer.get("name");
      httpsCertIssuerOptions.push({
        value: name,
        text: name
      });
    });

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
            options={httpsCertIssuerOptions}></Field>
        </Grid>
        {httpsCertIssuer === createIssuer ? (
          <CertificateIssuerForm onSubmit={this.submitCreateIssuer} initialValues={newEmptyCertificateIssuerForm()} />
        ) : null}
      </>
    );
  };

  public render() {
    const { classes, dispatch, handleSubmit, managedType } = this.props;

    return (
      <div className={classes.root}>
        <Grid container spacing={2}>
          <Grid item md={12}>
            <Field
              title=""
              component={KRadioGroupRender}
              name="managedType"
              options={[
                {
                  value: selfManaged,
                  label: "Upload an existing certificate",
                  explain:
                    "If you have got a ssl certificate from your ssl certificate provider, you can upload and use this."
                },
                {
                  value: issuerManaged,
                  label: "Apply a new certificate with certificate issuer",
                  explain: "If you wanna create new cerificate, you can select this."
                }
              ]}
            />
          </Grid>
          <Grid item md={12}>
            <Field
              label="Certificate name"
              component={KRenderTextField}
              name="name"
              margin="normal"
              validate={[ValidatorRequired]}
            />
          </Grid>
          {managedType === selfManaged ? this.renderSelfManagedFields() : this.renderIssuerManagedFields()}
          <Grid container spacing={2}>
            <Grid item md={8}></Grid>
            <Grid item md={2}>
              <Button type="submit" onClick={() => dispatch(setIsShowAddCertificateModal(false))} color="primary">
                Cancel
              </Button>
            </Grid>
            <Grid item md={2}>
              <Button type="submit" onClick={handleSubmit} color="primary">
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
