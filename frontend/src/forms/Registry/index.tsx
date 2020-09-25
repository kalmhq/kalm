import { Box, createStyles, Grid, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import { FormDataPreview } from "forms/Final/util";
import React from "react";
import { Field, Form, FormRenderProps } from "react-final-form";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "reducers";
import { RegistryFormType } from "types/registry";
import sc from "utils/stringConstants";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Prompt } from "widgets/Prompt";
import { FinalTextField } from "../Final/textfield";
import { ValidatorIsDNS123Label, ValidatorRegistryHost, ValidatorRequired } from "../validator";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
  });

const mapStateToProps = (state: RootState) => {
  return {
    isSubmittingRegistry: state.registries.isSubmittingRegistry,
  };
};

type RenderProps = FormRenderProps<RegistryFormType>;

interface ConnectedProps extends ReturnType<typeof mapStateToProps>, DispatchProp {}

export interface Props extends ConnectedProps, WithStyles<typeof styles> {
  isEdit?: boolean;
  onSubmit: any;
  initial: RegistryFormType;
}

class RegistryFormRaw extends React.PureComponent<Props> {
  public render() {
    const { classes, isEdit, onSubmit, isSubmittingRegistry, initial } = this.props;

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
                        placeholder="E.g. https://registry.kalm.dev"
                        helperText={<span>Leave blank for private docker hub registry</span>}
                      />
                    </Grid>
                  </Grid>

                  <FormDataPreview />
                </Box>
              }
            />
            <Box pt={2}>
              <SubmitButton disabled={isSubmittingRegistry}>Save</SubmitButton>
            </Box>
          </form>
        )}
      />
    );
  }
}

export const RegistryForm = connect(mapStateToProps)(withStyles(styles)(RegistryFormRaw));
