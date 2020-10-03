import { Box } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { Uploader } from "forms/Final/uploader";
import React from "react";
import { Form } from "react-final-form";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { CertificateFormType, selfManaged } from "types/certificate";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Prompt } from "widgets/Prompt";

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
    root: {},
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

interface State {}

class CertificateUploadFormRaw extends React.PureComponent<Props, State> {
  public render() {
    const { onSubmit, initialValues, isEdit, classes } = this.props;
    return (
      <Form onSubmit={onSubmit} initialValues={initialValues}>
        {(props) => {
          const {
            handleSubmit,
            error,
            values,
            form: { change },
          } = props;
          console.log(error);

          return (
            <form onSubmit={handleSubmit} tutorial-anchor-id="certificate-form-upload">
              <Box p={2}>
                <Prompt />
                <KPanel>
                  <Box p={2}>
                    <Uploader
                      inputlabel="Certificate (PEM file format)"
                      inputid="upload-certificate"
                      className={classes.fileInput}
                      name="selfManagedCertContent"
                      margin="normal"
                      id="certificate-selfManagedCertContent"
                      handleChange={(value: string) => {
                        change("selfManagedCertContent", value);
                      }}
                      multiline={true}
                      rows={12}
                      value={values.selfManagedCertContent}
                      placeholder="Paste or upload cert (PEM format)"
                    />
                    <Uploader
                      inputlabel="PrivateKey (PEM file format)"
                      placeholder="Paste or upload private key (PEM format)"
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
                  </Box>
                </KPanel>
                <Box pt={2}>
                  <SubmitButton id="save-certificate-button">{isEdit ? "Update" : "Create"}</SubmitButton>
                </Box>
              </Box>
            </form>
          );
        }}
      </Form>
    );
  }
}

export const CertificateUploadForm = connect(mapStateToProps)(withStyles(styles)(CertificateUploadFormRaw));
