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
import { renderTextField, RenderSelectField } from ".";
import { Grid, Button, IconButton, MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const renderDisks = ({
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
            <Grid item xs={3}>
              <Field
                name={`${field}.path`}
                component={renderTextField}
                label="Path"
              />
            </Grid>
            <Grid item xs={2}>
              <Field
                name={`${field}.storageClass`}
                component={RenderSelectField}
                label="StorageClass"
              >
                <MenuItem value="static">Static</MenuItem>
                <MenuItem value="external">External</MenuItem>
              </Field>
            </Grid>
            <Grid item xs={3}>
              <Field
                name={`${field}.size`}
                component={renderTextField}
                type="number"
                label="Size (Megabeta, M)"
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
        color="primary"
        onClick={() => fields.push({})}
      >
        Mount New Disk
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={() => fields.push({})}
      >
        Attach existing disk
      </Button>
    </div>
  );
};

export const renderDisk = ({
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

export const CustomDisks = (props: WrappedFieldArrayProps<{}> | {}) => {
  return (
    <div>
      <FieldArray {...props} name="disk" valid={true} component={renderDisks} />
    </div>
  );
};
