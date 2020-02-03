import React, { ComponentType } from "react";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import {
  Field,
  WrappedFieldProps,
  BaseFieldProps,
  FieldArray,
  BaseFieldArrayProps,
  WrappedFieldArrayProps
} from "redux-form";
import DeleteIcon from "@material-ui/icons/Delete";
import { renderTextField, renderSelectField } from ".";
import { Grid, Button, IconButton, MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const renderEnvs = ({
  fields,
  meta: { error, submitFailed }
}: WrappedFieldArrayProps<{}>) => {
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
      {fields.map((field, index) => (
        <div key={index}>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Field
                name={`${field}.name`}
                component={renderTextField}
                label="Name"
              />
            </Grid>
            <Grid item xs={2}>
              <Field
                name={`${field}.type`}
                component={renderSelectField}
                label="Type"
              >
                <MenuItem value="static">Static</MenuItem>
                <MenuItem value="external">External</MenuItem>
              </Field>
            </Grid>
            <Grid item xs={6}>
              <Field
                name={`${field}.value`}
                component={renderTextField}
                label="Value"
              ></Field>
            </Grid>
            <Grid item xs={1} className={classes.delete}>
              <IconButton
                aria-label="delete"
                onClick={() => fields.remove(index)}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </div>
      ))}
      <Button
        variant="contained"
        type="submit"
        color="primary"
        onClick={() => fields.push({})}
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

export const CustomEnvs = (props: WrappedFieldArrayProps<{}> | {}) => {
  return (
    <div>
      <FieldArray {...props} name="env" valid={true} component={renderEnvs} />
    </div>
  );
};
