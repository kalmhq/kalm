import {
  TextField as MTextField,
  OutlinedTextFieldProps
} from "@material-ui/core";
import React from "react";
import { WrappedFieldProps } from "redux-form";

export const TextField = ({
  input,
  meta: { touched, invalid, error },
  ...textFieldProps
}: WrappedFieldProps & Partial<OutlinedTextFieldProps>) => {
  return (
    <MTextField
      {...textFieldProps}
      autoComplete="off"
      error={touched && invalid}
      helperText={(touched && error) || textFieldProps.helperText}
      fullWidth
      size="small"
      margin="normal"
      variant="outlined"
      onChange={(event: any) => input.onChange(event.target.value)}
      value={input.value}
    />
  );
};
