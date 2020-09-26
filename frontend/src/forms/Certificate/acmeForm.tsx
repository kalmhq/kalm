import { Box, Grid } from "@material-ui/core";
import { FinalTextField } from "forms/Final/textfield";
import { FormDataPreview } from "forms/Final/util";
import React from "react";
import { Field, Form } from "react-final-form";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "reducers";
import { AcmeServerFormType } from "types/certificate";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Prompt } from "widgets/Prompt";
import { ValidatorIsDNS1123SubDomain } from "forms/validator";
import { trimAndToLowerParse } from "forms/normalizer";

const mapStateToProps = (state: RootState) => {
  return {
    isSubmittingCreateAcmeServer: state.certificates.isSubmittingCreateAcmeServer,
  };
};

export interface Props {
  onSubmit: any;
  initial: AcmeServerFormType;
}

class AcmeFormRaw extends React.PureComponent<Props & ReturnType<typeof mapStateToProps> & DispatchProp> {
  public render() {
    const { isSubmittingCreateAcmeServer, initial, onSubmit } = this.props;

    return (
      <Form
        initialValues={initial}
        onSubmit={onSubmit}
        keepDirtyOnReinitialize={true}
        render={({ handleSubmit }) => (
          <form id="acme-form" onSubmit={handleSubmit}>
            <Box p={2}>
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
                          helperText={"The domain name of your ACME server"}
                          placeholder="e.g. acme-random-suffix.your-domain.com"
                        />
                      </Grid>
                    </Grid>

                    <FormDataPreview />
                  </Box>
                }
              />
              <Box pt={2}>
                <SubmitButton disabled={isSubmittingCreateAcmeServer}>Save</SubmitButton>
              </Box>
            </Box>
          </form>
        )}
      />
    );
  }
}

export const AcmeForm = connect(mapStateToProps)(AcmeFormRaw);
