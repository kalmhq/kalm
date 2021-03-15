import { Box, Grid } from "@material-ui/core";
import { FinalTextField } from "forms/Final/textfield";
import { FormDataPreview } from "forms/Final/util";
import { trimAndToLowerParse } from "forms/normalizer";
import { ValidatorIsDNS1123SubDomain } from "forms/validator";
import React from "react";
import { Field, Form } from "react-final-form";
import { AcmeServerFormType } from "types/certificate";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Prompt } from "widgets/Prompt";

export interface Props {
  onSubmit: any;
  initial: AcmeServerFormType;
}

export const AcmeForm: React.FC<Props> = (props) => {
  const { initial, onSubmit } = props;

  return (
    <Form
      initialValues={initial}
      onSubmit={onSubmit}
      keepDirtyOnReinitialize={true}
      render={({ handleSubmit }) => (
        <form id="acme-form" onSubmit={handleSubmit}>
          <Prompt />
          <KPanel
            content={
              <Box p={2}>
                <Grid container spacing={2}>
                  <Grid item md={12}>
                    <Field
                      name="acmeDomain"
                      label="ACME Domain"
                      component={FinalTextField}
                      validate={ValidatorIsDNS1123SubDomain}
                      parse={trimAndToLowerParse}
                      helperText="The domain name of your ACME server"
                      placeholder="e.g. acme-random-suffix.your-domain.com"
                    />
                  </Grid>
                </Grid>

                <FormDataPreview />
              </Box>
            }
          />
          <Box pt={2}>
            <SubmitButton>Save</SubmitButton>
          </Box>
        </form>
      )}
    />
  );
};
