import { Button, Grid } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { createCertificateIssuerAction } from "actions/certificate";
import { KFreeSoloAutoCompleteMultiValues } from "forms/Basic/autoComplete";
import { KRadioGroupRender } from "forms/Basic/radio";
import { RenderSelectField } from "forms/Basic/select";
import { TextField } from "forms/Basic/text";
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
  selfManaged,
  CertificateIssuer,
  caForTest,
  cloudFlare
} from "types/certificate";
import { CertificateIssuerForm } from "./issuerForm";
import { Uploader } from "forms/Basic/uploader";
import { addCertificateDialogId } from "pages/Certificate/New";
import { closeDialogAction } from "actions/dialog";

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
  isEdit?: boolean;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    fileInput: {},
    label: {
      fontSize: 12,
      marginBottom: 18,
      display: "block"
    },
    editBtn: {
      marginLeft: 8
    }
  });

export interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp,
    InjectedFormProps<CertificateFormType> {
  isEdit?: boolean;
}

interface State {
  isEditCertificateIssuer: boolean;
}

class CertificateFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isEditCertificateIssuer: false
    };
  }

  private submitCreateIssuer = async (certificateIssuer: CertificateIssuerFormType) => {
    const { dispatch, change } = this.props;
    const { isEditCertificateIssuer } = this.state;
    try {
      await dispatch(createCertificateIssuerAction(certificateIssuer, isEditCertificateIssuer));
      change("httpsCertIssuer", certificateIssuer.get("name"));
      if (isEditCertificateIssuer) {
        this.setState({ isEditCertificateIssuer: false });
      }
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

  private generateHttpsCertIssuerOptions = () => {
    const { certificateIssuers } = this.props;
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

    if (certificateIssuers.size === 0) {
      this.setDefaultHttpsCertIssuer(createIssuer);
    } else {
      const certificateIssuer = certificateIssuers.first() as CertificateIssuer;
      this.setDefaultHttpsCertIssuer(certificateIssuer.get("name"));
    }

    return httpsCertIssuerOptions;
  };

  private setDefaultHttpsCertIssuer = (value: string) => {
    const { httpsCertIssuer, change } = this.props;
    if (!httpsCertIssuer) {
      change("httpsCertIssuer", value);
    }
  };

  private renderIssuerManagedFields = () => {
    const { classes, httpsCertIssuer } = this.props;
    const { isEditCertificateIssuer } = this.state;
    const httpsCertIssuerOptions = this.generateHttpsCertIssuerOptions();
    const certificateIssuer = this.getActiveCertificateIssuer();

    return (
      <>
        <Grid item md={12}>
          <Field
            InputLabelProps={{
              shrink: true
            }}
            placeholder="Please type domains"
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
          <label className={classes.label}>
            We are doing DNS01 challenge for you, please select your DNS Provider API and token.
          </label>
          <Field
            notSelectFirstIfValueIsUndefined
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
        {certificateIssuer && certificateIssuer.get("acmeCloudFlare") && (
          <Button
            className={classes.editBtn}
            onClick={() => this.setState({ isEditCertificateIssuer: true })}
            color="primary"
            disabled={isEditCertificateIssuer}
            variant={isEditCertificateIssuer ? "contained" : undefined}>
            Edit cloudflare issuser config
          </Button>
        )}
        {httpsCertIssuer === createIssuer || isEditCertificateIssuer ? (
          <CertificateIssuerForm
            isEdit={isEditCertificateIssuer}
            onSubmit={this.submitCreateIssuer}
            initialValues={this.generateCertificateIssuerForm()}
          />
        ) : null}
      </>
    );
  };

  private getActiveCertificateIssuer = () => {
    const { httpsCertIssuer, certificateIssuers } = this.props;
    return certificateIssuers.find(certificate => certificate.get("name") === httpsCertIssuer);
  };

  private generateCertificateIssuerForm = () => {
    const { isEditCertificateIssuer } = this.state;
    const certificateIssuer = this.getActiveCertificateIssuer();
    if (isEditCertificateIssuer && certificateIssuer) {
      return Immutable.fromJS({
        name: certificateIssuer.get("name"),
        issuerType: certificateIssuer.get("acmeCloudFlare") ? cloudFlare : caForTest,
        acmeCloudFlare: certificateIssuer.get("acmeCloudFlare")
      });
    } else {
      return newEmptyCertificateIssuerForm();
    }
  };

  public render() {
    const { classes, dispatch, handleSubmit, managedType, isEdit } = this.props;

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
              InputLabelProps={{
                shrink: true
              }}
              disabled={isEdit}
              placeholder="Please type a certificate name"
              label="Certificate name"
              component={TextField}
              name="name"
              margin="normal"
              validate={[ValidatorRequired]}
            />
          </Grid>
          {managedType === selfManaged ? this.renderSelfManagedFields() : this.renderIssuerManagedFields()}
          <Grid container spacing={2}>
            <Grid item md={8}></Grid>
            <Grid item md={2}>
              <Button onClick={() => dispatch(closeDialogAction(addCertificateDialogId))} color="primary">
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
