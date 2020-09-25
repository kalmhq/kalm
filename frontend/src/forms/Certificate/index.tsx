import { Box, Grid } from "@material-ui/core";
import { AutoCompleteMultiValuesFreeSolo } from "forms/Final/autoComplete";
import { ValidatorArrayOfIsValidHostInCertificate } from "forms/validator";
import React from "react";
import { Field, FieldRenderProps, Form } from "react-final-form";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { CertificateFormType } from "types/certificate";
import { KPanel } from "widgets/KPanel";
import { Body, Caption } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import sc from "../../utils/stringConstants";
import { FormTutorialHelper } from "tutorials/formValueToReudxStoreListener";
import { CERTIFICATE_FORM_ID } from "forms/formIDs";
import { stringArrayTrimAndToLowerCaseParse } from "forms/normalizer";
import { FormDataPreview } from "forms/Final/util";
import Button from "@material-ui/core/Button";
import { connect } from "react-redux";

const mapStateToProps = (state: RootState) => {
  return {};
};

interface OwnProps {
  isEdit?: boolean;
  onSubmit: any;
  initialValues: CertificateFormType;
}

export interface Props extends ReturnType<typeof mapStateToProps>, TDispatchProp, OwnProps {}

class CertificateFormRaw extends React.PureComponent<Props> {
  public render() {
    const { onSubmit, initialValues, isEdit } = this.props;
    return (
      <Form onSubmit={onSubmit} initialValues={initialValues} keepDirtyOnReinitialize>
        {({ handleSubmit }) => {
          return (
            <form onSubmit={handleSubmit} tutorial-anchor-id="certificate-form" id="certificate-form">
              <Box p={2}>
                <FormTutorialHelper form={CERTIFICATE_FORM_ID} />
                <Prompt message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />
                <KPanel
                  content={
                    <Box p={2}>
                      <Grid container spacing={2}>
                        <Grid item md={12}>
                          <Body>{sc.CERT_DNS01}</Body>
                          <Caption>{sc.CERT_DNS01_DESC}</Caption>
                        </Grid>
                        <Grid item md={12}>
                          <Field
                            render={(props: FieldRenderProps<string[]>) => (
                              <AutoCompleteMultiValuesFreeSolo<string> {...props} options={[]} />
                            )}
                            label="Domains"
                            name="domains"
                            validate={ValidatorArrayOfIsValidHostInCertificate}
                            parse={stringArrayTrimAndToLowerCaseParse}
                            id="certificate-domains"
                            placeholder="e.g. foo.com; *.foo.bar.com"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  }
                />

                <FormDataPreview />

                <Box pt={2}>
                  <Button id="save-certificate-button" type="submit" color="primary" variant="contained">
                    {isEdit ? "Update" : "Create"}
                  </Button>
                </Box>
              </Box>
            </form>
          );
        }}
      </Form>
    );
  }
}

export const CertificateForm = connect(mapStateToProps)(CertificateFormRaw);
