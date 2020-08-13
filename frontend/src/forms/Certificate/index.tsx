import { Box, Button, Chip, Grid, TextField } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { Autocomplete } from "@material-ui/lab";
import { Form, Formik, FormikProps } from "formik";
import { KFormikRadioGroupRender } from "forms/Basic/radio";
// import { KValidatorHostsWithWildcardPrefix, ValidatorRequired } from "forms/validator";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { CertificateFormTypeContent, issuerManaged, selfManaged } from "types/certificate";
import { ID } from "utils";
import DomainStatus from "widgets/DomainStatus";
import { KPanel } from "widgets/KPanel";
import { Caption } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import sc from "../../utils/stringConstants";
import { FormikUploader } from "forms/Basic/uploader";
import { extractDomainsFromCertificateContent } from "permission/utils";

const mapStateToProps = (state: RootState) => {
  return {
    certificateIssuers: state.get("certificates").get("certificateIssuers"),
    ingressIP: state.get("cluster").get("info").get("ingressIP"),
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

// const ValidatorCertificateValid = (value: any, _allValues?: any, _props?: any, _name?: any) => {
//   const domains = _props.values.get("domains");
//   if (!domains || domains.size < 1) {
//     return "Invalid Certificate";
//   }
//   return undefined;
// };

// const selfManagedCertContentValidators = [ValidatorRequired, ValidatorCertificateValid];
// const domainsValidators = [ValidatorRequired, KValidatorHostsWithWildcardPrefix];

class CertificateFormRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isEditCertificateIssuer: false,
    };
  }

  // public componentDidUpdate = (prevProps: Props) => {
  //   const { selfManagedCertContent, setFieldValue } = this.props;
  //   if (selfManagedCertContent && selfManagedCertContent !== prevProps.selfManagedCertContent) {
  //     const domains = extractDomainsFromCertificateContent(selfManagedCertContent);
  //     setFieldValue("domains", domains);
  //   }
  // };

  // private submitCreateIssuer = async (certificateIssuer: CertificateIssuerFormType) => {
  //   const { dispatch, setFieldValue } = this.props;
  //   const { isEditCertificateIssuer } = this.state;
  //   try {
  //     await dispatch(createCertificateIssuerAction(certificateIssuer, isEditCertificateIssuer));
  //     setFieldValue("httpsCertIssuer", certificateIssuer.get("name"));
  //     if (isEditCertificateIssuer) {
  //       this.setState({ isEditCertificateIssuer: false });
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // };

  private renderSelfManagedFields = (formikProps: FormikProps<CertificateFormTypeContent>) => {
    const { classes } = this.props;
    const { setFieldValue, values } = formikProps;
    if (values.selfManagedCertContent && values.domains.size <= 0) {
      const domains = extractDomainsFromCertificateContent(values.selfManagedCertContent);
      setFieldValue("domains", domains);
    }
    return (
      <>
        <Grid item md={12}>
          <FormikUploader
            inputlabel="Certificate file"
            inputid="upload-certificate"
            className={classes.fileInput}
            name="selfManagedCertContent"
            margin="normal"
            handleChange={(value: string) => {
              setFieldValue("selfManagedCertContent", value);
              const domains = extractDomainsFromCertificateContent(values.selfManagedCertContent);
              setFieldValue("domains", domains);
            }}
            multiline={true}
            rows={12}
            value={values.selfManagedCertContent}
          />
        </Grid>
        <Grid item md={12}>
          <FormikUploader
            inputlabel="Private Key"
            inputid="upload-private-key"
            multiline={true}
            className={classes.fileInput}
            rows={12}
            name="selfManagedCertPrivateKey"
            margin="normal"
            handleChange={(value: string) => {
              setFieldValue("selfManagedCertPrivateKey", value);
            }}
            value={values.selfManagedCertPrivateKey}
          />
        </Grid>
      </>
    );
  };

  // private generateHttpsCertIssuerOptions = () => {
  //   const { certificateIssuers } = this.props;
  //   const httpsCertIssuerOptions: any = [
  //     {
  //       value: ISSUER_FORM_ID,
  //       label: "Add new certificate issuer",
  //     },
  //   ];
  //   certificateIssuers.forEach((certificateIssuer) => {
  //     const name = certificateIssuer.get("name");

  //     httpsCertIssuerOptions.push({
  //       value: name,
  //       label: name,
  //       group: !certificateIssuer.get("acmeCloudFlare") ? "CA for Test" : "Cloudflare",
  //     });
  //   });

  //   if (certificateIssuers.size === 0) {
  //     this.setDefaultHttpsCertIssuer(ISSUER_FORM_ID);
  //   } else {
  //     const certificateIssuer = certificateIssuers.first() as CertificateIssuer;
  //     this.setDefaultHttpsCertIssuer(certificateIssuer.get("name"));
  //   }

  //   return httpsCertIssuerOptions;
  // };

  // private setDefaultHttpsCertIssuer = (value: string) => {
  //   const { httpsCertIssuer, setFieldValue } = this.props;
  //   if (!httpsCertIssuer) {
  //     setFieldValue("httpsCertIssuer", value);
  //   }
  // };

  // private renderIssuerManagedFields = () => {
  //   const { classes, httpsCertIssuer } = this.props;
  //   const { isEditCertificateIssuer } = this.state;
  //   const httpsCertIssuerOptions = this.generateHttpsCertIssuerOptions();
  //   const certificateIssuer = this.getActiveCertificateIssuer();

  //   return (
  //     <>
  //       <Grid item md={12}>
  //         <label className={classes.label}>
  //           We are doing DNS01 challenge for you, please select your DNS Provider API and token.
  //         </label>
  //         <Field
  //           notSelectFirstIfValueIsUndefined
  //           label="Certificate issuser"
  //           multiline={true}
  //           className={classes.fileInput}
  //           component={KAutoCompleteSingleValue}
  //           name="httpsCertIssuer"
  //           margin="normal"
  //           validate={ValidatorRequired}
  //           options={httpsCertIssuerOptions}
  //         ></Field>
  //       </Grid>
  //       {certificateIssuer && certificateIssuer.get("acmeCloudFlare") && (
  //         <Button
  //           className={classes.editBtn}
  //           onClick={() => this.setState({ isEditCertificateIssuer: true })}
  //           color="primary"
  //           disabled={isEditCertificateIssuer}
  //           variant={isEditCertificateIssuer ? "contained" : undefined}
  //         >
  //           Edit cloudflare issuser config
  //         </Button>
  //       )}
  //       {httpsCertIssuer === ISSUER_FORM_ID || isEditCertificateIssuer ? (
  //         <CertificateIssuerForm
  //           isEdit={isEditCertificateIssuer}
  //           onSubmit={this.submitCreateIssuer}
  //           initialValues={this.generateCertificateIssuerForm()}
  //         />
  //       ) : null}
  //     </>
  //   );
  // };

  // private getActiveCertificateIssuer = () => {
  //   const { httpsCertIssuer, certificateIssuers } = this.props;
  //   return certificateIssuers.find((certificate) => certificate.get("name") === httpsCertIssuer);
  // };

  // private generateCertificateIssuerForm = () => {
  //   const { isEditCertificateIssuer } = this.state;
  //   const certificateIssuer = this.getActiveCertificateIssuer();
  //   if (isEditCertificateIssuer && certificateIssuer) {
  //     return Immutable.fromJS({
  //       name: certificateIssuer.get("name"),
  //       issuerType: certificateIssuer.get("acmeCloudFlare") ? cloudFlare : caForTest,
  //       acmeCloudFlare: certificateIssuer.get("acmeCloudFlare"),
  //     });
  //   } else {
  //     return newEmptyCertificateIssuerForm();
  //   }
  // };

  private validate = async (values: any) => {
    let errors: any = {};

    if (!values.domains) {
      errors.domains = "Required";
      return errors;
    }

    return errors;
  };

  public render() {
    const { onSubmit, initialValues, classes, isEdit, ingressIP } = this.props;
    return (
      <Formik
        onSubmit={onSubmit}
        initialValues={initialValues}
        validate={this.validate}
        validateOnChange={false}
        validateOnBlur={false}
        enableReinitialize={false}
        handleReset={console.log}
      >
        {(formikProps) => {
          const { values, dirty, handleChange, touched, errors, handleBlur, setFieldValue } = formikProps;
          const icons = Immutable.List(values.domains.map((domain) => <DomainStatus domain={domain} />));
          const domainsFieldID = ID();
          return (
            <Form className={classes.root} tutorial-anchor-id="certificate-form">
              <Prompt when={dirty} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
              <KPanel
                content={
                  <Box p={2}>
                    <Grid container spacing={2}>
                      {isEdit ? null : (
                        <Grid item md={12}>
                          <KFormikRadioGroupRender
                            title=""
                            error={!!errors.managedType && touched.managedType}
                            name="managedType"
                            value={values.managedType}
                            onChange={handleChange}
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
                        <TextField
                          InputLabelProps={{
                            shrink: true,
                          }}
                          disabled={isEdit}
                          placeholder="Please type a certificate name"
                          label="Certificate name"
                          name="name"
                          id="certificate-name"
                          margin="normal"
                          fullWidth
                          onBlur={handleBlur}
                          error={!!errors.name && touched.name}
                          helperText={!!errors.name && touched.name ? errors.name : " "}
                          variant="outlined"
                          inputProps={{
                            required: false, // bypass html5 required feature
                          }}
                          value={values.name}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item md={12}>
                        <Autocomplete
                          multiple
                          autoSelect
                          clearOnEscape
                          freeSolo
                          size="small"
                          options={[]}
                          id={domainsFieldID}
                          onBlur={handleBlur}
                          value={values.domains.toJS()}
                          onChange={(e, value) => {
                            setFieldValue("domains", Immutable.List(value));
                          }}
                          renderTags={(value: string[], getTagProps) => {
                            return value.map((option: string, index: number) => {
                              return (
                                <Chip
                                  icon={icons ? icons.get(index) : undefined}
                                  variant="outlined"
                                  label={option}
                                  // classes={{ root: clsx({ [classes.error]: errorsIsArray && errorsArray[index] }) }}
                                  size="small"
                                  {...getTagProps({ index })}
                                />
                              );
                            });
                          }}
                          renderInput={(params) => {
                            return (
                              <TextField
                                {...params}
                                margin="dense"
                                variant="outlined"
                                error={!!touched.domains && !!errors.domains}
                                label="Domains"
                                placeholder={
                                  values.managedType === selfManaged
                                    ? "Extract domains information when you upload a certificate file"
                                    : "Please type domains"
                                }
                                helperText={
                                  (!!touched.domains && !!errors.domains && errors.domains) || (
                                    <Caption color="textSecondary">
                                      Your cluster ip is{" "}
                                      <Link
                                        to="#"
                                        onClick={() => {
                                          const isDomainsIncludeIngressIP = !!values.domains.find(
                                            (domain) => domain === ingressIP,
                                          );
                                          if (!isDomainsIncludeIngressIP) {
                                            setFieldValue("domains", values.domains.push(ingressIP));
                                          }
                                        }}
                                      >
                                        {ingressIP}
                                      </Link>
                                      . {sc.ROUTE_HOSTS_INPUT_HELPER}
                                    </Caption>
                                  )
                                }
                              />
                            );
                          }}
                        />
                      </Grid>
                    </Grid>
                    {values.managedType === selfManaged ? this.renderSelfManagedFields(formikProps) : null}
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
