import { Box, Button, Grid } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { setSuccessNotificationAction } from "actions/notification";
import copy from "copy-to-clipboard";
import { AutoCompleteMultiValuesFreeSolo } from "forms/Final/autoComplete";
import { FinalTextField } from "forms/Final/textfield";
import { ValidatorHostsOld } from "forms/validator";
import { extractDomainsFromCertificateContent } from "permission/utils";
import React from "react";
import { Field, FieldRenderProps, Form } from "react-final-form";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { CertificateFormType, selfManaged } from "types/certificate";
import DomainStatus from "widgets/DomainStatus";
import { KPanel } from "widgets/KPanel";
import { Body, Caption } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import sc from "../../utils/stringConstants";
import { FormMidware } from "tutorials/formMidware";
import { CERTIFICATE_FORM_ID } from "forms/formIDs";
import { finalValidateOrNotBlockByTutorial } from "tutorials/utils";
import { FormDataPreview } from "forms/Final/util";

const mapStateToProps = (state: RootState) => {
  return {
    tutorialState: state.tutorial,
    certificateIssuers: state.certificates.certificateIssuers,
    ingressIP: state.cluster.info.ingressIP || "---.---.---.---",
    acmeServer: state.certificates.acmeServer,
    acmeServerIsReady: state.certificates.acmeServer !== null ? state.certificates.acmeServer?.ready : null,
    isLoadingAcmeServer: state.certificates.isAcmeServerLoading,
    form: CERTIFICATE_FORM_ID,
  };
};

interface OwnProps {
  isEdit?: boolean;
  onSubmit: any;
  initialValues: CertificateFormType;
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

  private validate = async (values: CertificateFormType) => {
    const { form, tutorialState } = this.props;
    let errors: any = {};
    if (values.managedType === selfManaged && (!values.domains || values.domains.length < 1)) {
      errors.selfManagedCertContent = "Invalid Certificate";
      return errors;
    }

    return Object.keys(errors).length > 0 ? errors : finalValidateOrNotBlockByTutorial(values, tutorialState, form);
  };

  public render() {
    const { onSubmit, initialValues, classes, isEdit, ingressIP, dispatch, form } = this.props;
    return (
      <Form onSubmit={onSubmit} initialValues={initialValues} validate={this.validate}>
        {(props) => {
          const {
            values,
            dirty,
            touched,
            errors,
            form: { change },
            submitting,
            handleSubmit,
          } = props;
          const icons = values.domains.map((domain, index) =>
            Array.isArray(errors.domains) && errors.domains[index] ? undefined : <DomainStatus domain={domain} />,
          );
          if (!dirty && values.selfManagedCertContent && values.domains.length <= 0) {
            const domains = extractDomainsFromCertificateContent(values.selfManagedCertContent);
            change("domains", domains);
          }
          let hasWildcardDomains = false;
          values.domains.map((domain) => {
            if (domain.startsWith("*.")) {
              hasWildcardDomains = true;
            }
            return domain;
          });
          return (
            <form
              className={classes.root}
              onSubmit={handleSubmit}
              tutorial-anchor-id="certificate-form"
              id="certificate-form"
            >
              <FormMidware values={values} form={form} />
              <Prompt when={dirty && !submitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
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
                          component={FinalTextField}
                          label="Certificate name"
                          name="name"
                          disabled={isEdit}
                          placeholder="Please type a certificate name"
                          id="certificate-name"
                          helperText={!!errors.name && touched && touched.name ? errors.name : ""}
                        />
                      </Grid>
                      <Grid item md={12}>
                        <Field
                          render={(props: FieldRenderProps<string[]>) => (
                            <AutoCompleteMultiValuesFreeSolo<string> {...props} options={[]} />
                          )}
                          disabled={values.managedType === selfManaged}
                          label="Domains"
                          name="domains"
                          validate={ValidatorHostsOld}
                          icons={icons}
                          id="certificate-domains"
                          placeholder={
                            values.managedType === selfManaged
                              ? "Extract domains information when you upload a certificate file"
                              : "Please type domains"
                          }
                          helperText={
                            <Caption color="textSecondary">
                              {hasWildcardDomains ? (
                                "Kalm will use DNS Challenge to make certficate, Kalm DNS Serve will automatic run for this."
                              ) : (
                                <>
                                  {" "}
                                  Kalm will use HTTP Challenge to make certficate Your cluster ip is{" "}
                                  <Link
                                    to="#"
                                    onClick={() => {
                                      copy(ingressIP);
                                      dispatch(setSuccessNotificationAction("Copied successful!"));
                                    }}
                                  >
                                    {ingressIP}
                                  </Link>
                                  .{sc.ROUTE_HOSTS_INPUT_HELPER}
                                </>
                              )}
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
              <FormDataPreview />
            </form>
          );
        }}
      </Form>
    );
  }
}

export const CertificateForm = connect(mapStateToProps)(withStyles(styles)(CertificateFormRaw));
