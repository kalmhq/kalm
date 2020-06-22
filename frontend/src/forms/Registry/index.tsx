import { createStyles, Grid, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, reduxForm } from "redux-form/immutable";
import { RootState } from "reducers";
import { RegistryType } from "types/registry";
import { KRenderTextField } from "../Basic/textfield";
import { ValidatorName, ValidatorRequired } from "../validator";
import { Prompt } from "widgets/Prompt";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

export interface Props {
  isEdit?: boolean;
}

class RegistryFormRaw extends React.PureComponent<
  Props &
    InjectedFormProps<RegistryType, Props> &
    ReturnType<typeof mapStateToProps> &
    WithStyles<typeof styles> &
    DispatchProp
> {
  public render() {
    const { handleSubmit, classes, isEdit, dirty } = this.props;

    return (
      <form onSubmit={handleSubmit} className={classes.root}>
        <Prompt when={dirty} message="Are you sure to leave without saving changes?" />
        <Grid container spacing={2}>
          <Grid item md={12}>
            <Field
              name="name"
              label="Name"
              disabled={isEdit}
              component={KRenderTextField}
              validate={[ValidatorRequired, ValidatorName]}
              helperText={
                isEdit
                  ? "Can't modify name"
                  : 'The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
              }
              placeholder="Please type the registry name"
            />
          </Grid>
          <Grid item md={12}>
            <Field
              name="host"
              label="Host"
              component={KRenderTextField}
              validate={[ValidatorRequired]}
              placeholder="Please type the registry host"
            />
          </Grid>
          <Grid item md={12}>
            <Field
              name="username"
              label="Username"
              component={KRenderTextField}
              validate={[ValidatorRequired]}
              placeholder="Please type the registry username"
            />
          </Grid>{" "}
          <Grid item md={12}>
            <Field
              type="password"
              name="password"
              label="Password"
              component={KRenderTextField}
              validate={[ValidatorRequired]}
              placeholder="Please type the registry password"
            />
          </Grid>
        </Grid>
      </form>
    );
  }
}

export const registryInitialValues: RegistryType = Immutable.fromJS({
  name: "",
});

export const RegistryForm = reduxForm<RegistryType, Props>({
  form: "registry",
  enableReinitialize: true,
  keepDirtyOnReinitialize: false,
  initialValues: registryInitialValues,
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  },
})(connect(mapStateToProps)(withStyles(styles)(RegistryFormRaw)));
