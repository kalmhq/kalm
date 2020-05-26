import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import React, { ChangeEvent } from "react";
import { WrappedFieldProps } from "redux-form";

interface Props {}

// value type is string
export const KRenderTextField = ({
  input,
  label,
  helperText,
  placeholder,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & Props) => {
  const showError = !!error && touched;

  return (
    <TextField
      fullWidth
      error={showError}
      label={label}
      helperText={showError ? error : helperText ? helperText : ""}
      margin="dense"
      variant="outlined"
      value={input.value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => input.onChange(event.target.value)}
    />
  );
};
