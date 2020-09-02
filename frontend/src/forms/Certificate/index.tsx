import { createCertificateIssuerAction } from "actions/certificate";
import { Button, Grid, Box } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { KAutoCompleteSingleValue, KFreeSoloAutoCompleteMultipleSelectStringField } from "forms/Basic/autoComplete";
// import { KRadioGroupRender } from "forms/Basic/radio";
import { KRenderDebounceTextField } from "forms/Basic/textfield";
import {
  ValidatorRequired,
  KValidatorHostsWithWildcardPrefix,
  //  KValidatorWildcardHost
} from "forms/validator";
import Immutable from "immutable";
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
  // issuerManaged,
  newEmptyCertificateIssuerForm,
  dns01Mananged,
} from "types/certificate";
import { CertificateIssuerForm } from "forms/Certificate/issuerForm";
// import DomainStatus from "widgets/DomainStatus";
import { connect } from "react-redux";
import { Prompt } from "widgets/Prompt";
import { CERTIFICATE_FORM_ID, ISSUER_FORM_ID } from "../formIDs";
import { Caption, Body, H6 } from "widgets/Label";
import { Link } from "react-router-dom";
import { KPanel } from "widgets/KPanel";
import copy from "copy-to-clipboard";
import { setSuccessNotificationAction } from "actions/notification";
import { Loading } from "widgets/Loading";
import { KAcmeServerCard, KAcmeServerFormCard } from "widgets/AcmeServerCard";

const mapStateToProps = (state: RootState, { form }: OwnProps) => {
  const selector = formValueSelector(form || CERTIFICATE_FORM_ID);
  const syncErrors = getFormSyncErrors(form || CERTIFICATE_FORM_ID)(state) as { [key: string]: any };
  return {
    syncErrors,
    name: selector(state, "name") as string,
    managedType: selector(state, "managedType") as string,
    httpsCertIssuer: selector(state, "httpsCertIssuer") as string,
    certificateIssuers: state.get("certificates").get("certificateIssuers") as CertificateIssuerList,
    domains: selector(state, "domains") as Immutable.List<string>,
    ingressIP: state.get("cluster").get("info").get("ingressIP", "---.---.---.---"),
    acmeServer: state.get("certificates").get("acmeServer"),
    acmeServerIsReady:
      state.get("certificates").get("acmeServer") !== null
        ? state.get("certificates").get("acmeServer")!.get("ready")
        : null,
    isLoadingAcmeServer: state.get("certificates").get("isAcmeServerLoading"),
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

const domainsValidators = [ValidatorRequired, KValidatorHostsWithWildcardPrefix];
// const wildcardDomainValidators = [ValidatorRequired, KValidatorWildcardHost];

class CertificateFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isEditCertificateIssuer: false,
    };
  }

  public componentDidUpdate = (prevProps: Props) => {};

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

  private renderAcmeServerFrom = () => {
    const { isLoadingAcmeServer, acmeServer } = this.props;
    if (acmeServer) {
      return !isLoadingAcmeServer && <KAcmeServerFormCard acmeServer={acmeServer} />;
    }
    return null;
  };
  private renderAcmeServerInfo = () => {
    const { isLoadingAcmeServer, acmeServer } = this.props;
    if (acmeServer) {
      return <>{isLoadingAcmeServer ? <Loading /> : <KAcmeServerCard acmeServer={acmeServer} />}</>;
    }
    return null;
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

  private getHelperTextForDomain = (): React.ReactNode => {
    const { managedType, ingressIP, dispatch } = this.props;
    return managedType === dns01Mananged ? (
      <Caption color="textSecondary">please input a wildcard domain,eg *.app.kalm.live </Caption>
    ) : (
      <Caption color="textSecondary">
        Your cluster ip is{" "}
        <Link
          to="#"
          onClick={() => {
            copy(ingressIP);
            dispatch(setSuccessNotificationAction("Copied successful!"));
          }}
        >
          {ingressIP}
        </Link>
        . {sc.ROUTE_HOSTS_INPUT_HELPER}
      </Caption>
    );
  };

  public render() {
    const {
      classes,
      // domains,
      handleSubmit,
      managedType,
      isEdit,
      dirty,
      submitSucceeded,
      acmeServerIsReady,
    } = this.props;
    // const icons = Immutable.List(domains.map((domain) => <DomainStatus domain={domain} />));

    return (
      <>
        <form onSubmit={handleSubmit} className={classes.root} tutorial-anchor-id="certificate-form">
          <Prompt when={dirty && !submitSucceeded} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
          <KPanel
            content={
              <Box p={2}>
                <Grid container spacing={2}>
                  {isEdit
                    ? null
                    : // <Grid item md={12}>
                      //   <Field
                      //     title=""
                      //     component={KRadioGroupRender}
                      //     name="managedType"
                      //     options={[
                      //       {
                      //         value: issuerManaged,
                      //         label: sc.CERT_AUTO,
                      //         explain: sc.CERT_AUTO_DESC,
                      //       },
                      //       {
                      //         value: dns01Mananged,
                      //         label: sc.CERT_DNS01_WILDCARD,
                      //         explain: sc.CERT_DNS01_WILDCARD_DESC,
                      //       },
                      //     ]}
                      //   />
                      // </Grid>
                      null}
                  <Box p={2}>
                    <H6>{sc.CERT_AUTO}</H6>
                    <Body>{sc.CERT_AUTO_DESC}</Body>
                  </Box>

                  <Grid item md={12}>
                    {managedType === dns01Mananged ? this.renderAcmeServerInfo() : null}
                  </Grid>
                  {managedType !== dns01Mananged || acmeServerIsReady ? (
                    <>
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
                          helperText={this.getHelperTextForDomain()}
                          placeholder={"Please type domains"}
                          label="Domains"
                          icons={undefined}
                          multiline={true}
                          className={classes.fileInput}
                          rows={12}
                          name="domains"
                          validate={domainsValidators}
                        />
                      </Grid>
                    </>
                  ) : null}
                </Grid>
              </Box>
            }
          />
          {managedType !== dns01Mananged || acmeServerIsReady ? (
            <Box pt={2}>
              <Button
                id="save-certificate-button"
                type="submit"
                onClick={handleSubmit}
                color="primary"
                variant="contained"
              >
                {isEdit ? "Update" : "Create"}
              </Button>
            </Box>
          ) : null}
        </form>
        <Grid item md={12}>
          {managedType === dns01Mananged ? this.renderAcmeServerFrom() : null}
        </Grid>
      </>
    );
  }
}

export const CertificateForm = reduxForm<CertificateFormType, OwnProps>({
  onSubmitFail: console.log,
  form: CERTIFICATE_FORM_ID,
  touchOnChange: true,
})(connect(mapStateToProps)(withStyles(styles)(CertificateFormRaw)));
