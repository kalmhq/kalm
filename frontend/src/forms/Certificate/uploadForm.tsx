import { Box } from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Uploader } from "forms/Final/uploader";
import React from "react";
import { Form } from "react-final-form";
import { CertificateFormType } from "types/certificate";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Prompt } from "widgets/Prompt";

const useStyles = makeStyles((theme: Theme) =>
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
  }),
);

interface Props {
  isEdit?: boolean;
  onSubmit: any;
  initialValues: CertificateFormType;
}

export const CertificateUploadForm: React.FC<Props> = (props) => {
  const classes = useStyles();
  const { onSubmit, initialValues, isEdit } = props;

  return (
    <Form onSubmit={onSubmit} initialValues={initialValues}>
      {(props) => {
        const {
          handleSubmit,
          values,
          form: { change },
        } = props;

        return (
          <form onSubmit={handleSubmit}>
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
};
