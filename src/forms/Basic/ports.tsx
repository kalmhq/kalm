import React from "react";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import {
  Field,
  WrappedFieldProps,
  FieldArray,
  WrappedFieldArrayProps
} from "redux-form";
import DeleteIcon from "@material-ui/icons/Delete";
import { renderTextField, RenderSelectField } from ".";
import { Grid, Button, IconButton, MenuItem, Divider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

export const portTypeTCP = "TCP";
export const portTypeUDP = "UDP";

const generateNewPort = () => ({
  name: "",
  protocol: portTypeTCP,
  containerPort: "",
  servicePort: ""
});

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
    },
    divider: {
      marginBottom: theme.spacing(3)
    }
  }))();

  return (
    <div>
      <div>{submitFailed && error && <span>{error}</span>}</div>
      {fields.map((port, index) => (
        <div key={index}>
          <Grid container spacing={2} className={classes.divider}>
            <Grid item xs={10}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Field
                    classes={{ root: classes.field }}
                    name={`${port}.name`}
                    required
                    autoFocus
                    component={renderTextField}
                    label="Port Name"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Field
                    classes={{ root: classes.field }}
                    name={`${port}.protocol`}
                    component={RenderSelectField}
                    label="Protocol"
                  >
                    <MenuItem value={portTypeTCP}>TCP</MenuItem>
                    <MenuItem value={portTypeUDP}>UDP</MenuItem>
                  </Field>
                </Grid>
                <Grid item xs={6}>
                  <Field
                    classes={{ root: classes.field }}
                    name={`${port}.containerPort`}
                    type="number"
                    required
                    component={renderTextField}
                    label="Conpoment Port"
                    placeholder="8080"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Field
                    classes={{ root: classes.field }}
                    name={`${port}.servicePort`}
                    required
                    type="number"
                    component={renderTextField}
                    label="Service Port"
                    placeholder="80"
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={2} className={classes.delete}>
              <IconButton
                aria-label="delete"
                onClick={() => fields.remove(index)}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
          {index !== fields.length - 1 ? (
            <Divider classes={{ root: classes.divider }} />
          ) : null}
        </div>
      ))}
      <Button
        variant="contained"
        color="primary"
        onClick={() => fields.push(generateNewPort())}
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
