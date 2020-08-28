import { Button, Grid, Box } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { KFreeSoloAutoCompleteMultipleSelectStringField } from "forms/Basic/autoComplete";
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
import { CertificateFormType, CertificateIssuerList, selfManaged } from "types/certificate";
import DomainStatus from "widgets/DomainStatus";
import { connect } from "react-redux";
import { Prompt } from "widgets/Prompt";
import { CERTIFICATE_UPLOAD_FORM_ID } from "../formIDs";
import { Caption } from "widgets/Label";
import { Link } from "react-router-dom";
import { KPanel } from "widgets/KPanel";
import copy from "copy-to-clipboard";
import { setSuccessNotificationAction } from "actions/notification";

const mapStateToProps = (state: RootState, { form }: OwnProps) => {
  const selector = formValueSelector(form || CERTIFICATE_UPLOAD_FORM_ID);
  const syncErrors = getFormSyncErrors(form || CERTIFICATE_UPLOAD_FORM_ID)(state) as { [key: string]: any };
  return {
    syncErrors,
    name: selector(state, "name") as string,
    managedType: selfManaged as string,
    selfManagedCertContent: selector(state, "selfManagedCertContent") as string,
    selfManagedCertPrivateKey: selector(state, "selfManagedCertPrivateKey") as string,
    httpsCertIssuer: selector(state, "httpsCertIssuer") as string,
    certificateIssuers: state.get("certificates").get("certificateIssuers") as CertificateIssuerList,
    domains: selector(state, "domains") as Immutable.List<string>,
    ingressIP: state.get("cluster").get("info").get("ingressIP", "---.---.---.---"),
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

class CertificateUploadFormRaw extends React.PureComponent<Props, State> {
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

  public render() {
    const {
      classes,
      domains,
      handleSubmit,
      managedType,
      isEdit,
      dirty,
      submitSucceeded,
      ingressIP,
      dispatch,
    } = this.props;
    const icons = Immutable.List(domains.map((domain) => <DomainStatus domain={domain} />));

    return (
      <form onSubmit={handleSubmit} className={classes.root} tutorial-anchor-id="certificate-form-upload">
        <Prompt when={dirty && !submitSucceeded} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
        <KPanel
          content={
            <Box p={2}>
              <Grid container spacing={2}>
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
                            copy(ingressIP);
                            dispatch(setSuccessNotificationAction("Copied successful!"));
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

export const CertificateUploadForm = reduxForm<CertificateFormType, OwnProps>({
  onSubmitFail: console.log,
  form: CERTIFICATE_UPLOAD_FORM_ID,
  touchOnChange: true,
})(connect(mapStateToProps)(withStyles(styles)(CertificateUploadFormRaw)));
