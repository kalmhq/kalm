import React, { ComponentType } from "react";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import {
  Field,
  WrappedFieldProps,
  BaseFieldProps,
  FieldArray,
  BaseFieldArrayProps,
  WrappedFieldArrayProps,
  getFormValues,
  formValueSelector,
  focus
} from "redux-form";
import DeleteIcon from "@material-ui/icons/Delete";
import { renderTextField, RenderSelectField } from ".";
import { Grid, Button, IconButton, MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "../../reducers";

interface EnvValue {
  name: string;
  type: string;
  value: string;
}

export const EnvTypeExternal = "external";
export const EnvTypeStatic = "static";

const generateEmptyEnv = (): EnvValue => ({
  name: "",
  type: EnvTypeStatic,
  value: ""
});

const renderEnvs = ({
  fields,
  meta: { error, submitFailed }
}: WrappedFieldArrayProps<EnvValue>) => {
  const classes = makeStyles(theme => ({
    delete: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }))();

  return (
    <div>
      <div>{submitFailed && error && <span>{error}</span>}</div>
      {fields.map((field, index) => {
        const currentEnv = fields.get(index);
        const isCurrentEnvExternal =
          !!currentEnv.type && currentEnv.type === EnvTypeExternal;

        return (
          <div key={index}>
            <Grid container spacing={2}>
              <Grid item xs={2}>
                <Field
                  name={`${field}.type`}
                  component={RenderSelectField}
                  label="Type"
                >
                  <MenuItem value={EnvTypeStatic}>Static</MenuItem>
                  <MenuItem value={EnvTypeExternal}>External</MenuItem>
                </Field>
              </Grid>
              <Grid item xs={3}>
                <Field
                  name={`${field}.name`}
                  required={true}
                  component={renderTextField}
                  label="Name"
                  autoFocus
                />
              </Grid>
              <Grid item xs={6}>
                <Field
                  disabled={isCurrentEnvExternal}
                  required={!isCurrentEnvExternal}
                  name={`${field}.value`}
                  component={renderTextField}
                  label={
                    isCurrentEnvExternal
                      ? "DISABLED. External will be configured later."
                      : "Value"
                  }
                ></Field>
              </Grid>
              <Grid item xs={1} className={classes.delete}>
                <IconButton
                  aria-label="delete"
                  onClick={() => {
                    fields.remove(index);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          </div>
        );
      })}
      <Button
        variant="contained"
        color="primary"
        onClick={() => fields.push(generateEmptyEnv())}
      >
        Add Environment Variable
      </Button>
    </div>
  );
};

export const renderEnv = ({
  label,
  input,
  placeholder,
  helperText,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & Props) => (
  <TextField
    label={label}
    error={touched && invalid}
    helperText={(touched && error) || helperText}
    placeholder={placeholder}
    fullWidth
    margin="normal"
    variant="filled"
    {...input}
    {...custom}
  />
);

interface Props {
  label?: string;
  helperText?: string;
  placeholder?: string;
}

let envs = (props: WrappedFieldArrayProps<{}> | {}) => {
  return (
    <div>
      <FieldArray {...props} name="env" valid={true} component={renderEnvs} />
    </div>
  );
};

// export const CustomEnvs = connect((state: RootState) => {
//   const selector = formValueSelector("component");
//   const values = selector(state, "env");
//   return { values };
// })(envs);

export const CustomEnvs = envs;
