import { Box, Button, Grid } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { setSuccessNotificationAction } from "actions/notification";
import copy from "copy-to-clipboard";
import { Uploader } from "forms/Final/uploader";
import { AutoCompleteMultiValuesFreeSolo } from "forms/Final/autoComplete";
import { FinalTextField } from "forms/Final/textfield";
import { ValidatorHostsOld } from "forms/validator";
import { extractDomainsFromCertificateContent } from "permission/utils";
import React from "react";
import { Field, FieldRenderProps, Form, FormRenderProps } from "react-final-form";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { CertificateFormType, selfManaged } from "types/certificate";
import DomainStatus from "widgets/DomainStatus";
import { KPanel } from "widgets/KPanel";
import { Caption } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import sc from "../../utils/stringConstants";

const mapStateToProps = (state: RootState, { form }: OwnProps) => {
  return {
    managedType: selfManaged as string,
    certificateIssuers: state.certificates.certificateIssuers,
    ingressIP: state.cluster.info.ingressIP || "---.---.---.---",
  };
};

interface OwnProps {
  form?: string;
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

export interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  isEdit?: boolean;
  onSubmit: any;
  initialValues: CertificateFormType;
}

interface State {
  isEditCertificateIssuer: boolean;
}

class CertificateUploadFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isEditCertificateIssuer: false,
    };
  }

  private renderSelfManagedFields = (props: FormRenderProps<CertificateFormType>) => {
    const { classes } = this.props;
    const {
      form: { change },
      values,
      errors,
      touched,
    } = props;
    return (
      <>
        <Grid item md={12}>
          <Uploader
            touched={touched && touched.selfManagedCertContent}
            errorText={errors.selfManagedCertContent}
            inputlabel="Certificate file"
            inputid="upload-certificate"
            className={classes.fileInput}
            name="selfManagedCertContent"
            margin="normal"
            id="certificate-selfManagedCertContent"
            handleChange={(value: string) => {
              change("selfManagedCertContent", value);
              const domains = extractDomainsFromCertificateContent(value);
              change("domains", domains);
            }}
            multiline={true}
            rows={12}
            value={values.selfManagedCertContent}
          />
        </Grid>
        <Grid item md={12}>
          <Uploader
            touched={touched && touched.selfManagedCertPrivateKey}
            errorText={errors.selfManagedCertPrivateKey}
            inputlabel="Private Key"
            inputid="upload-private-key"
            multiline={true}
            className={classes.fileInput}
            rows={12}
            id="certificate-selfManagedCertPrivateKey"
            name="selfManagedCertPrivateKey"
            margin="normal"
            handleChange={(value: string) => {
              change("selfManagedCertPrivateKey", value);
            }}
            value={values.selfManagedCertPrivateKey}
          />
        </Grid>
      </>
    );
  };

  private validate = async (values: CertificateFormType) => {
    let errors: any = {};

    if (values.managedType === selfManaged && (!values.domains || values.domains.length < 1)) {
      errors.selfManagedCertContent = "Invalid Certificate";
      return errors;
    }

    return errors;
  };

  public render() {
    const { onSubmit, initialValues, classes, isEdit, ingressIP, dispatch } = this.props;
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
          return (
            <form className={classes.root} onSubmit={handleSubmit} tutorial-anchor-id="certificate-form-upload">
              <Prompt when={dirty && !submitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
              <KPanel
                content={
                  <Box p={2}>
                    <Grid container spacing={0}>
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
                          name="domains"
                          validate={ValidatorHostsOld}
                          icons={icons}
                          value={values.domains}
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
                    {values.managedType === selfManaged ? this.renderSelfManagedFields(props) : null}
                  </Box>
                }
              />
              <Box pt={2}>
                <Button id="save-certificate-button" type="submit" color="primary" variant="contained">
                  {isEdit ? "Update" : "Create"}
                </Button>
              </Box>
            </form>
          );
        }}
      </Form>
    );
  }
}

export const CertificateUploadForm = connect(mapStateToProps)(withStyles(styles)(CertificateUploadFormRaw));
