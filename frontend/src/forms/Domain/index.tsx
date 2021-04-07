import { Box, Grid } from "@material-ui/core";
import { FinalTextField } from "forms/Final/textfield";
import { FormDataPreview } from "forms/Final/util";
import { trimAndToLowerParse } from "forms/normalizer";
import { ValidatorIsCommonOrWildcardDNS1123SubDomain } from "forms/validator";
import React from "react";
import { Field, Form } from "react-final-form";
import { DomainCreation } from "types/domains";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Body, Caption } from "widgets/Label";
import sc from "../../utils/stringConstants";

interface Props {
  onSubmit: any;
}

const DomainFormRaw: React.FC<Props> = (props) => {
  const { onSubmit } = props;

  return (
    <Form<DomainCreation> onSubmit={onSubmit} initialValues={{ domain: "" }} keepDirtyOnReinitialize>
      {({ handleSubmit }) => {
        return (
          <form onSubmit={handleSubmit} id="domain-form">
            <KPanel>
              <Box p={2}>
                <Grid container spacing={2}>
                  <Grid item md={12}>
                    <Body>{sc.DOMAIN}</Body>
                    <Caption>{sc.DOMAIN_DESC}</Caption>
                  </Grid>
                  <Grid item md={12}>
                    <Field
                      component={FinalTextField}
                      autoFocus
                      label="Domain"
                      name="domain"
                      validate={ValidatorIsCommonOrWildcardDNS1123SubDomain}
                      parse={trimAndToLowerParse}
                      id="domain"
                      placeholder={`e.g. "foo.com" or "*.foo.bar.com"`}
                      helperText="Wildcard certificate is supported"
                    />
                  </Grid>
                </Grid>
              </Box>
            </KPanel>

            <Box pt={2}>
              <SubmitButton id="save-domain-button">Add Domain</SubmitButton>
            </Box>

            <FormDataPreview />
          </form>
        );
      }}
    </Form>
  );
};

export const DomainForm = DomainFormRaw;
