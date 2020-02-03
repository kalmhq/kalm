import React from "react";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import {
  Field,
  WrappedFieldProps,
  FieldArray,
  WrappedFieldArrayProps
} from "redux-form";
import DeleteIcon from "@material-ui/icons/Delete";
import { renderTextField, renderSelectField } from ".";
import { Grid, Button, IconButton, MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const renderPorts = ({
  fields,
  meta: { error, submitFailed }
}: WrappedFieldArrayProps<{}>) => {
  const classes = makeStyles(theme => ({
    delete: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    field: {
      margin: 0
    }
  }))();

  return (
    <div>
      <div>{submitFailed && error && <span>{error}</span>}</div>
      {fields.map((port, index) => (
        <div key={index}>
          <Grid container spacing={2}>
            <Grid item xs={5}>
              <Field
                classes={{ root: classes.field }}
                name={`${port}.name`}
                component={renderTextField}
                label="Port Name"
              />
            </Grid>
            <Grid item xs={2}>
              <Field
                classes={{ root: classes.field }}
                name={`${port}.protocol`}
                component={renderSelectField}
                label="Protocol"
              >
                <MenuItem value="TCP">TCP</MenuItem>
                <MenuItem value="UDP">UDP</MenuItem>
              </Field>
            </Grid>
            <Grid item xs={2}>
              <Field
                classes={{ root: classes.field }}
                name={`${port}.containerPort`}
                type="number"
                component={renderTextField}
                label="Conpoment Port"
              />
            </Grid>
            <Grid item xs={2}>
              <Field
                classes={{ root: classes.field }}
                name={`${port}.servicePort`}
                type="number"
                component={renderTextField}
                label="Service Port"
              />
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
        Add Port
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

export const CustomPorts = (props: WrappedFieldArrayProps<{}> | {}) => {
  return (
    <div>
      <FieldArray
        {...props}
        name="ports"
        valid={true}
        component={renderPorts}
      />
    </div>
  );
};
