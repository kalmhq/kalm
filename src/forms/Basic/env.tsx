import { Button, Grid, IconButton, MenuItem, Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import DeleteIcon from "@material-ui/icons/Delete";
import Imutable from "immutable";
import React from "react";
import { WrappedFieldArrayProps, WrappedFieldProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { RenderAutoComplete, RenderSelectField, renderTextField } from ".";
import { ImmutableMap } from "../../typings";
import { ValidatorRequired } from "../validator";

export const EnvTypeExternal = "external";
export const EnvTypeStatic = "static";
export const EnvTypeShared = "shared";

type EnvType =
  | typeof EnvTypeExternal
  | typeof EnvTypeStatic
  | typeof EnvTypeShared;

type EnvValue = ImmutableMap<{
  name: string;
  type: EnvType;
  value: string;
}>;

const generateEmptyEnv = (): EnvValue =>
  Imutable.Map({
    name: "",
    type: EnvTypeStatic,
    value: ""
  });

const renderEnvs = ({
  fields,
  meta: { error, submitFailed }
}: WrappedFieldArrayProps<EnvValue> & Props) => {
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
          !!currentEnv.get("type") &&
          currentEnv.get("type") === EnvTypeExternal;

        return (
          <div key={index}>
            <Grid container spacing={2}>
              <Grid item xs={2}>
                <Field
                  name={`${field}.type`}
                  component={RenderSelectField}
                  label="Type"
                  validate={[ValidatorRequired]}
                >
                  <MenuItem value={EnvTypeStatic}>Static</MenuItem>
                  <MenuItem value={EnvTypeExternal}>External</MenuItem>
                </Field>
              </Grid>
              <Grid item xs={3}>
                <Field
                  name={`${field}.name`}
                  component={renderTextField}
                  label="Name"
                  validate={[ValidatorRequired]}
                  autoFocus
                />
              </Grid>
              <Grid item xs={6}>
                <Field
                  disabled={isCurrentEnvExternal}
                  validate={!isCurrentEnvExternal ? ValidatorRequired : []}
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
        variant="outlined"
        size="small"
        color="primary"
        onClick={() => fields.push(generateEmptyEnv())}
      >
        Add Environment Variable
      </Button>
    </div>
  );
};

interface SharedProps {
  missingVariables?: string[];
}

export const RenderSharedEnvs = ({
  fields,
  meta: { error, submitFailed },
  missingVariables
}: WrappedFieldArrayProps<EnvValue> & SharedProps) => {
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

        return (
          <div key={currentEnv.get("name")}>
            <Grid container spacing={2}>
              <Grid item xs={5}>
                <Field
                  name={`${field}.name`}
                  component={RenderAutoComplete}
                  label="Name"
                  validate={ValidatorRequired}
                  autoFocus
                >
                  {(missingVariables || []).map(x => (
                    <MenuItem key={x} value={x}>
                      {x}
                    </MenuItem>
                  ))}
                </Field>
              </Grid>
              <Grid item xs={6}>
                <Field
                  name={`${field}.value`}
                  component={renderTextField}
                  validate={ValidatorRequired}
                  label="Value"
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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={2}
      >
        <Button
          variant="outlined"
          size="small"
          color="primary"
          onClick={() => fields.push(generateEmptyEnv())}
        >
          Add Shared Environment Variable
        </Button>

        {missingVariables ? (
          <Box color="secondary.main" display="inline">
            Still <strong>{missingVariables.length}</strong> Environment
            Variables are not defined.
          </Box>
        ) : null}
      </Box>
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

let Envs = (props: Props) => {
  return (
    <FieldArray {...props} name="env" valid={true} component={renderEnvs} />
  );
};

let SharedEnvs = (props: Props) => {
  return (
    <FieldArray
      {...props}
      name="sharedEnv"
      valid={true}
      component={RenderSharedEnvs}
    />
  );
};

// export const CustomEnvs = connect((state: RootState) => {
//   const selector = formValueSelector("component");
//   const values = selector(state, "env");
//   return { values };
// })(envs);

export const CustomEnvs = (props: Props) => {
  return <Envs {...props} />;
};
