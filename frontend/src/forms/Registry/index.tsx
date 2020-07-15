import { createStyles, Grid, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, getFormValues, reduxForm } from "redux-form/immutable";
import { RootState } from "reducers";
import { newEmptyRegistry, RegistryType } from "types/registry";
import { KRenderTextField } from "../Basic/textfield";
import { RequireNoSuffix, RequirePrefix, ValidatorName, ValidatorRequired } from "../validator";
import { Prompt } from "widgets/Prompt";
import { REGISTRY_FORM_ID } from "../formIDs";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  const fieldValues = (getFormValues(REGISTRY_FORM_ID)(state) as RegistryType) || (Immutable.Map() as RegistryType);

  return {
    fieldValues,
  };
};

export interface Props {
  isEdit?: boolean;
}

const validateName = [ValidatorRequired, ValidatorName];
const validateHost = [ValidatorRequired, RequirePrefix("https://"), RequireNoSuffix("/")];

class RegistryFormRaw extends React.PureComponent<
  Props &
    InjectedFormProps<RegistryType, Props> &
    ReturnType<typeof mapStateToProps> &
    WithStyles<typeof styles> &
    DispatchProp
> {
  public render() {
    const { handleSubmit, classes, isEdit, dirty, submitSucceeded } = this.props;

    return (
      <form onSubmit={handleSubmit} className={classes.root}>
        <Prompt when={dirty && !submitSucceeded} message="Are you sure to leave without saving changes?" />
        <Grid container spacing={2}>
          <Grid item md={12}>
            <Field
              name="name"
              label="Name"
              disabled={isEdit}
              component={KRenderTextField}
              validate={validateName}
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
              validate={validateHost}
              placeholder="Please type the registry host"
            />
          </Grid>
          <Grid item md={12}>
            <Field
              name="username"
              label="Username"
              autocomplete="off"
              component={KRenderTextField}
              validate={ValidatorRequired}
              placeholder="Please type the registry username"
            />
          </Grid>{" "}
          <Grid item md={12}>
            <Field
              type="password"
              name="password"
              label="Password"
              autocomplete="off"
              component={KRenderTextField}
              validate={ValidatorRequired}
              placeholder="Please type the registry password"
            />
          </Grid>
        </Grid>

        {process.env.REACT_APP_DEBUG === "true" ? (
          <pre style={{ maxWidth: 1500, background: "#eee" }}>
            {JSON.stringify(this.props.fieldValues, undefined, 2)}
          </pre>
        ) : null}
      </form>
    );
  }
}

export const RegistryForm = reduxForm<RegistryType, Props>({
  form: REGISTRY_FORM_ID,
  enableReinitialize: true,
  keepDirtyOnReinitialize: false,
  initialValues: newEmptyRegistry(),
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  },
})(connect(mapStateToProps)(withStyles(styles)(RegistryFormRaw)));
