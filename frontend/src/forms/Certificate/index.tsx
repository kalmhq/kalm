import { Box, Grid } from "@material-ui/core";
import { FinalSelectField } from "forms/Final/select";
import { FormDataPreview } from "forms/Final/util";
import { CERTIFICATE_FORM_ID } from "forms/formIDs";
import { trimAndToLowerParse } from "forms/normalizer";
import { ValidatorIsCommonOrWildcardDNS1123SubDomain } from "forms/validator";
import React from "react";
import { Field, Form } from "react-final-form";
import { useSelector } from "react-redux";
import { RootState } from "store";
import { FormTutorialHelper } from "tutorials/formValueToReduxStoreListener";
import { CertificateFormType } from "types/certificate";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Body, Caption } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import sc from "../../utils/stringConstants";

export interface Props {
  isEdit?: boolean;
  onSubmit: any;
  initialValues: CertificateFormType;
}

const CertificateFormRaw: React.FC<Props> = (props) => {
  const { onSubmit, initialValues, isEdit } = props;

  const { domains } = useSelector((state: RootState) => {
    return {
      domains: state.domains.domains,
    };
  });

  const readyDomains = domains;

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
                          name="domains"
                          component={FinalSelectField}
                          label="Domain"
                          validate={ValidatorIsCommonOrWildcardDNS1123SubDomain}
                          parse={(v) => [trimAndToLowerParse(v)] as any}
                          format={(v: any) => v[0]}
                          options={readyDomains.map((x) => ({
                            value: x.domain,
                            text: x.domain,
                          }))}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                }
              />

              <FormDataPreview />

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

export const CertificateForm = CertificateFormRaw;
