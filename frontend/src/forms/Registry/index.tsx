import { Box, createStyles, Grid } from "@material-ui/core";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { FormDataPreview } from "forms/Final/util";
import { trimAndToLowerParse, trimParse } from "forms/normalizer";
import React from "react";
import { Field, Form, FormRenderProps } from "react-final-form";
import { RegistryFormType } from "types/registry";
import sc from "utils/stringConstants";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Prompt } from "widgets/Prompt";
import { FinalTextField } from "../Final/textfield";
import { ValidatorIsDNS123Label, ValidatorRegistryHost, ValidatorRequired } from "../validator";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
  }),
);

type RenderProps = FormRenderProps<RegistryFormType>;

interface Props {
  isEdit?: boolean;
  onSubmit: any;
  initial: RegistryFormType;
}

const RegistryFormRaw: React.FC<Props> = (props) => {
  const classes = useStyles();
  const { isEdit, onSubmit, initial } = props;

  return (
    <Form
      debug={process.env.REACT_APP_DEBUG === "true" ? console.log : undefined}
      subscription={{ submitting: true, pristine: true }}
      keepDirtyOnReinitialize
      initialValues={initial}
      onSubmit={onSubmit}
      render={({ handleSubmit }: RenderProps) => (
        <form onSubmit={handleSubmit} className={classes.root} id="registry-form">
          <Prompt />
          <KPanel
            content={
              <Box p={2}>
                <Grid container spacing={2}>
                  <Grid item md={12}>
                    <Field
                      name="name"
                      label="Name"
                      disabled={isEdit}
                      component={FinalTextField}
                      validate={ValidatorIsDNS123Label}
                      parse={trimParse}
                      helperText={isEdit ? "Can't modify name" : sc.NAME_RULE}
                    />
                  </Grid>
                  <Grid item md={12}>
                    <Field
                      name="username"
                      label="Username"
                      autoComplete="off"
                      component={FinalTextField}
                      validate={ValidatorRequired}
                    />
                  </Grid>
                  <Grid item md={12}>
                    <Field
                      name="password"
                      htmlType="password"
                      label="Password"
                      title="Password"
                      autoComplete="off"
                      component={FinalTextField}
                      validate={ValidatorRequired}
                    />
                  </Grid>
                  <Grid item md={12}>
                    <Field
                      name="host"
                      label="Host"
                      component={FinalTextField}
                      validate={ValidatorRegistryHost}
                      parse={trimAndToLowerParse}
                      placeholder="E.g. https://ghcr.io"
                      helperText={<span>The 'Host' field can be left blank for private docker hub registries</span>}
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

export const RegistryForm = RegistryFormRaw;
