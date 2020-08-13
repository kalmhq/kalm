import { createCertificateIssuerAction } from "actions/certificate";
import { Button, Grid, Box } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { KAutoCompleteSingleValue, KFreeSoloAutoCompleteMultipleSelectStringField } from "forms/Basic/autoComplete";
import { KRadioGroupRender } from "forms/Basic/radio";
import { KRenderDebounceTextField } from "forms/Basic/textfield";
import { Uploader } from "forms/Basic/uploader";
import { ValidatorRequired, KValidatorHostsWithWildcardPrefix } from "forms/validator";
import Immutable from "immutable";
import { extractDomainsFromCertificateContent } from "permission/utils";
import React from "react";
import { RootState } from "reducers";
import { InjectedFormProps } from "redux-form";
import { Field, formValueSelector, getFormSyncErrors, reduxForm } from "redux-form/immutable";
import { TDispatchProp } from "types";
import sc from "../../utils/stringConstants";
import {
  caForTest,
  CertificateFormType,
  CertificateIssuer,
  CertificateIssuerFormType,
  CertificateIssuerList,
  cloudFlare,
  issuerManaged,
  newEmptyCertificateIssuerForm,
  selfManaged,
} from "types/certificate";
import { CertificateIssuerForm } from "forms/Certificate/issuerForm";
import DomainStatus from "widgets/DomainStatus";
import { connect } from "react-redux";
import { Prompt } from "widgets/Prompt";
import { CERTIFICATE_FORM_ID, ISSUER_FORM_ID } from "../formIDs";
import { Caption } from "widgets/Label";
import { Link } from "react-router-dom";
import { KPanel } from "widgets/KPanel";

const mapStateToProps = (state: RootState, { form }: OwnProps) => {
  const selector = formValueSelector(form || CERTIFICATE_FORM_ID);
  const syncErrors = getFormSyncErrors(form || CERTIFICATE_FORM_ID)(state) as { [key: string]: any };
  return {
    syncErrors,
    name: selector(state, "name") as string,
    managedType: selector(state, "managedType") as string,
    selfManagedCertContent: selector(state, "selfManagedCertContent") as string,
    selfManagedCertPrivateKey: selector(state, "selfManagedCertPrivateKey") as string,
    httpsCertIssuer: selector(state, "httpsCertIssuer") as string,
    certificateIssuers: state.get("certificates").get("certificateIssuers") as CertificateIssuerList,
    domains: selector(state, "domains") as Immutable.List<string>,
    ingressIP: state.get("cluster").get("info").get("ingressIP"),
  };
};

interface OwnProps {
  form?: string;
  isEdit?: boolean;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
    fileInput: {},
    label: {
      fontSize: 12,
      marginBottom: 18,
      display: "block",
    },
    editBtn: {
      marginLeft: 8,
    },
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

const ValidatorCertificateValid = (value: any, _allValues?: any, _props?: any, _name?: any) => {
  const domains = _props.values.get("domains");
  if (!domains || domains.size < 1) {
    return "Invalid Certificate";
  }
  return undefined;
};

const selfManagedCertContentValidators = [ValidatorRequired, ValidatorCertificateValid];
const domainsValidators = [ValidatorRequired, KValidatorHostsWithWildcardPrefix];

class CertificateFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isEditCertificateIssuer: false,
    };
  }

  public componentDidUpdate = (prevProps: Props) => {
    const { selfManagedCertContent, change } = this.props;
    if (selfManagedCertContent && selfManagedCertContent !== prevProps.selfManagedCertContent) {
      const domains = extractDomainsFromCertificateContent(selfManagedCertContent);
      change("domains", domains);
    }
  };

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
            validate={selfManagedCertContentValidators}
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
            validate={ValidatorRequired}
          />
        </Grid>
      </>
    );
  };

  private generateHttpsCertIssuerOptions = () => {
    const { certificateIssuers } = this.props;
    const httpsCertIssuerOptions: any = [
      {
        value: ISSUER_FORM_ID,
        label: "Add new certificate issuer",
      },
    ];
    certificateIssuers.forEach((certificateIssuer) => {
      const name = certificateIssuer.get("name");

      httpsCertIssuerOptions.push({
        value: name,
        label: name,
        group: !certificateIssuer.get("acmeCloudFlare") ? "CA for Test" : "Cloudflare",
      });
    });

    if (certificateIssuers.size === 0) {
      this.setDefaultHttpsCertIssuer(ISSUER_FORM_ID);
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
          <label className={classes.label}>
            We are doing DNS01 challenge for you, please select your DNS Provider API and token.
          </label>
          <Field
            notSelectFirstIfValueIsUndefined
            label="Certificate issuser"
            multiline={true}
            className={classes.fileInput}
            component={KAutoCompleteSingleValue}
            name="httpsCertIssuer"
            margin="normal"
            validate={ValidatorRequired}
            options={httpsCertIssuerOptions}
          ></Field>
        </Grid>
        {certificateIssuer && certificateIssuer.get("acmeCloudFlare") && (
          <Button
            className={classes.editBtn}
            onClick={() => this.setState({ isEditCertificateIssuer: true })}
            color="primary"
            disabled={isEditCertificateIssuer}
            variant={isEditCertificateIssuer ? "contained" : undefined}
          >
            Edit cloudflare issuser config
          </Button>
        )}
        {httpsCertIssuer === ISSUER_FORM_ID || isEditCertificateIssuer ? (
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
    return certificateIssuers.find((certificate) => certificate.get("name") === httpsCertIssuer);
  };

  private generateCertificateIssuerForm = () => {
    const { isEditCertificateIssuer } = this.state;
    const certificateIssuer = this.getActiveCertificateIssuer();
    if (isEditCertificateIssuer && certificateIssuer) {
      return Immutable.fromJS({
        name: certificateIssuer.get("name"),
        issuerType: certificateIssuer.get("acmeCloudFlare") ? cloudFlare : caForTest,
        acmeCloudFlare: certificateIssuer.get("acmeCloudFlare"),
      });
    } else {
      return newEmptyCertificateIssuerForm();
    }
  };

  public render() {
    const {
      classes,
      domains,
      handleSubmit,
      managedType,
      isEdit,
      dirty,
      submitSucceeded,
      change,
      ingressIP,
    } = this.props;
    const icons = Immutable.List(domains.map((domain) => <DomainStatus domain={domain} />));

    return (
      <form onSubmit={handleSubmit} className={classes.root} tutorial-anchor-id="certificate-form">
        <Prompt when={dirty && !submitSucceeded} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
        <KPanel
          content={
            <Box p={2}>
              <Grid container spacing={2}>
                {isEdit ? null : (
                  <Grid item md={12}>
                    <Field
                      title=""
                      component={KRadioGroupRender}
                      name="managedType"
                      options={[
                        {
                          value: issuerManaged,
                          label: sc.CERT_AUTO,
                          explain: sc.CERT_AUTO_DESC,
                        },
                        {
                          value: selfManaged,
                          label: sc.CERT_UPLOAD,
                          explain: sc.CERT_UPLOAD_DESC,
                        },
                      ]}
                    />
                  </Grid>
                )}
                <Grid item md={12}>
                  <Field
                    InputLabelProps={{
                      shrink: true,
                    }}
                    disabled={isEdit}
                    placeholder="Please type a certificate name"
                    label="Certificate name"
                    component={KRenderDebounceTextField}
                    name="name"
                    id="certificate-name"
                    margin="normal"
                  />
                </Grid>
                <Grid item md={12}>
                  <KFreeSoloAutoCompleteMultipleSelectStringField
                    disabled={managedType === selfManaged}
                    helperText={
                      <Caption color="textSecondary">
                        Your cluster ip is{" "}
                        <Link
                          to="#"
                          onClick={() => {
                            const isDomainsIncludeIngressIP = !!domains.find((domain) => domain === ingressIP);
                            if (!isDomainsIncludeIngressIP) {
                              change("domains", domains.push(ingressIP));
                            }
                          }}
                        >
                          {ingressIP}
                        </Link>
                        . {sc.ROUTE_HOSTS_INPUT_HELPER}
                      </Caption>
                    }
                    placeholder={
                      managedType === selfManaged
                        ? "Extract domains information when you upload a certificate file"
                        : "Please type domains"
                    }
                    label="Domains"
                    icons={icons}
                    multiline={true}
                    className={classes.fileInput}
                    rows={12}
                    name="domains"
                    validate={managedType === selfManaged ? [] : domainsValidators}
                  />
                </Grid>
              </Grid>
              {managedType === selfManaged ? this.renderSelfManagedFields() : null}
            </Box>
          }
        />
        <Box pt={2}>
          <Button id="save-certificate-button" type="submit" onClick={handleSubmit} color="primary" variant="contained">
            {isEdit ? "Update" : "Create"}
          </Button>
        </Box>
      </form>
    );
  }
}

export const CertificateForm = reduxForm<CertificateFormType, OwnProps>({
  onSubmitFail: console.log,
  form: CERTIFICATE_FORM_ID,
  touchOnChange: true,
})(connect(mapStateToProps)(withStyles(styles)(CertificateFormRaw)));
