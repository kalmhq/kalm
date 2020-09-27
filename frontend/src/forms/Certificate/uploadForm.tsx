import { Box, Grid } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { AutoCompleteMultiValuesFreeSolo } from "forms/Final/autoComplete";
import { ValidatorArrayOfIsValidHostInCertificate } from "forms/validator";
import { extractDomainsFromCertificateContent } from "permission/utils";
import React from "react";
import { Field, FieldRenderProps, Form, FormRenderProps } from "react-final-form";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { CertificateFormType, selfManaged } from "types/certificate";
import { SubmitButton } from "widgets/Button";
import DomainStatus from "widgets/DomainStatus";
import { KPanel } from "widgets/KPanel";
import { Prompt } from "widgets/Prompt";
import { Uploader } from "forms/Final/uploader";
import { stringArrayTrimAndToLowerCaseParse } from "forms/normalizer";

const mapStateToProps = (state: RootState, { form }: OwnProps) => {
  return {
    managedType: selfManaged as string,
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
            inputlabel="Certificate (PEM file format)"
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
            multiline
            rows={12}
            value={values.selfManagedCertContent}
          />
        </Grid>
        <Grid item md={12}>
          <Uploader
            touched={touched && touched.selfManagedCertPrivateKey}
            errorText={errors.selfManagedCertPrivateKey}
            inputlabel="PrivateKey (PEM file format)"
            inputid="upload-private-key"
            multiline
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

    if (!values.domains || values.domains.length < 1) {
      errors.selfManagedCertContent = "Invalid Certificate";
      return errors;
    }

    return errors;
  };

  public render() {
    const { onSubmit, initialValues, classes, isEdit } = this.props;
    return (
      <Form onSubmit={onSubmit} initialValues={initialValues} validate={this.validate}>
        {(props) => {
          const {
            values,
            dirty,
            errors,
            form: { change },
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
              <Prompt />
              <KPanel>
                <Box p={2}>
                  {this.renderSelfManagedFields(props)}
                  <Field
                    render={(props: FieldRenderProps<string[]>) => (
                      <AutoCompleteMultiValuesFreeSolo<string> {...props} options={[]} />
                    )}
                    disabled={true}
                    name="domains"
                    validate={ValidatorArrayOfIsValidHostInCertificate}
                    parse={stringArrayTrimAndToLowerCaseParse}
                    icons={icons}
                    value={values.domains}
                    id="certificate-domains"
                    placeholder="Extract domains information when you upload a certificate file"
                  />
                </Box>
              </KPanel>
              <Box pt={2}>
                <SubmitButton id="save-certificate-button">{isEdit ? "Update" : "Create"}</SubmitButton>
              </Box>
            </form>
          );
        }}
      </Form>
    );
  }
}

export const CertificateUploadForm = connect(mapStateToProps)(withStyles(styles)(CertificateUploadFormRaw));
