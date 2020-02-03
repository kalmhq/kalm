import React from "react";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import {
  Field,
  WrappedFieldProps,
  BaseFieldProps,
  WrappedFieldMetaProps
} from "redux-form";
import { FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import FormHelperText from "@material-ui/core/FormHelperText";
import { ID } from "../../utils";
import { makeStyles } from "@material-ui/core/styles";

export const renderTextField = ({
  label,
  input,
  placeholder,
  helperText,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & Props) => {
  const classes = makeStyles(theme => ({
    root: {
      margin: 0
    }
  }))();

  return (
    <TextField
      classes={{ root: classes.root }}
      label={label}
      error={touched && invalid}
      helperText={(touched && error) || helperText}
      placeholder={placeholder}
      fullWidth
      size="small"
      margin="normal"
      variant="filled"
      {...input}
      {...custom}
    />
  );
};

interface Props {
  label?: string;
  helperText?: string;
  placeholder?: string;
}

export const CustomTextField = (props: BaseFieldProps & Props) => {
  return (
    <div>
      <Field {...props} component={renderTextField} />
    </div>
  );
};

const renderFromHelper = ({
  touched,
  error
}: Pick<WrappedFieldMetaProps, "touched" | "error">) => {
  if (!(touched && error)) {
    return;
  } else {
    return <FormHelperText>{touched && error}</FormHelperText>;
  }
};

interface SelectProps {
  label: string;
  children: React.ReactNode;
}

export const renderSelectField = ({
  input,
  label,
  meta: { touched, error },
  children,
  ...custom
}: WrappedFieldProps & SelectProps) => {
  const id = ID();

  const classes = makeStyles(theme => ({
    root: {
      display: "flex"
    }
  }))();

  return (
    <FormControl
      classes={{ root: classes.root }}
      error={touched && error}
      variant="filled"
      size="small"
    >
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <Select
        {...input}
        {...custom}
        inputProps={{
          id: id
        }}
      >
        {children}
      </Select>
      {renderFromHelper({ touched, error })}
    </FormControl>
  );
};
