import { Box, Button, Grid } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { Field, Form, Formik } from "formik";
import { KRenderDebounceFormikTextField } from "forms/Basic/textfield";
import { ValidateHost } from "forms/validator";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { FormMidware } from "tutorials/formMidware";
import { TDispatchProp } from "types";
import { CertificateIssuerList } from "types/certificate";
import { CERTIFICATE_FORM_ID } from "../formIDs";
import { Caption, Body } from "widgets/Label";
import { Link } from "react-router-dom";
import { KPanel } from "widgets/KPanel";
import copy from "copy-to-clipboard";
import { setSuccessNotificationAction } from "actions/notification";
import { CertificateFormTypeContent, selfManaged } from "types/certificate";
import DomainStatus from "widgets/DomainStatus";
import { Prompt } from "widgets/Prompt";
import sc from "../../utils/stringConstants";
import { extractDomainsFromCertificateContent } from "permission/utils";
import { KFreeSoloFormikAutoCompleteMultiValues } from "forms/Basic/autoComplete";

const mapStateToProps = (state: RootState) => {
  return {
    certificateIssuers: state.get("certificates").get("certificateIssuers") as CertificateIssuerList,
    ingressIP: state.get("cluster").get("info").get("ingressIP", "---.---.---.---"),
    acmeServer: state.get("certificates").get("acmeServer"),
    acmeServerIsReady:
      state.get("certificates").get("acmeServer") !== null
        ? state.get("certificates").get("acmeServer")?.get("ready")
        : null,
    isLoadingAcmeServer: state.get("certificates").get("isAcmeServerLoading"),
  };
};

interface OwnProps {
  isEdit?: boolean;
  onSubmit: any;
  initialValues: CertificateFormTypeContent;
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

export interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp, OwnProps {}

interface State {
  isEditCertificateIssuer: boolean;
}

class CertificateFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isEditCertificateIssuer: false,
    };
  }

  public componentDidUpdate = (prevProps: Props) => {};

  private validate = async (values: CertificateFormTypeContent) => {
    let errors: any = {};

    if (values.managedType === selfManaged && (!values.domains || values.domains.length < 1)) {
      errors.selfManagedCertContent = "Invalid Certificate";
      return errors;
    }

    errors.domains = values.domains.map(ValidateHost);
    if (errors.domains.filter((e: string | undefined) => e).length < 1) {
      delete errors.domains;
    }

    if (values.domains.length < 1) {
      errors.domains = "Required";
      return errors;
    }

    return errors;
  };

  public render() {
    const { onSubmit, initialValues, classes, isEdit, ingressIP, dispatch } = this.props;
    return (
      <Formik
        onSubmit={onSubmit}
        initialValues={initialValues}
        validate={this.validate}
        enableReinitialize={false}
        handleReset={console.log}
      >
        {(formikProps) => {
          const { values, dirty, touched, errors, setFieldValue, isSubmitting } = formikProps;
          const icons = Immutable.List(
            values.domains.map((domain, index) =>
              Array.isArray(errors.domains) && errors.domains[index] ? undefined : <DomainStatus domain={domain} />,
            ),
          );
          if (!dirty && values.selfManagedCertContent && values.domains.length <= 0) {
            const domains = extractDomainsFromCertificateContent(values.selfManagedCertContent);
            setFieldValue("domains", domains);
          }
          return (
            <Form className={classes.root} tutorial-anchor-id="certificate-form" id="certificate-form">
              <FormMidware values={values} form={CERTIFICATE_FORM_ID} />
              <Prompt when={dirty && !isSubmitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
              <KPanel
                content={
                  <Box p={2}>
                    <Grid container spacing={2}>
                      <Grid item md={12}>
                        <Body>{sc.CERT_DNS01_WILDCARD}</Body>
                        <Caption>{sc.CERT_DNS01_WILDCARD_DESC}</Caption>
                      </Grid>
                      <Grid item md={12}>
                        <Field
                          component={KRenderDebounceFormikTextField}
                          label="Certificate name"
                          name="name"
                          disabled={isEdit}
                          placeholder="Please type a certificate name"
                          id="certificate-name"
                          helperText={!!errors.name && touched.name ? errors.name : " "}
                        />
                      </Grid>
                      <Grid item md={12}>
                        <Field
                          component={KFreeSoloFormikAutoCompleteMultiValues}
                          disabled={values.managedType === selfManaged}
                          label="Domains"
                          name="domains"
                          icons={icons}
                          id="certificate-domains"
                          placeholder={
                            values.managedType === selfManaged
                              ? "Extract domains information when you upload a certificate file"
                              : "Please type domains"
                          }
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
                        />
                      </Grid>
                    </Grid>
                  </Box>
                }
              />
              <Box pt={2}>
                <Button id="save-certificate-button" type="submit" color="primary" variant="contained">
                  {isEdit ? "Update" : "Create"}
                </Button>
              </Box>
            </Form>
          );
        }}
      </Formik>
    );
  }
}

export const CertificateForm = connect(mapStateToProps)(withStyles(styles)(CertificateFormRaw));
