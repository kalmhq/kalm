import { InputAdornment, OutlinedInputProps } from "@material-ui/core";
import TextField, { TextFieldProps } from "@material-ui/core/TextField";
import React from "react";
import { FieldRenderProps } from "react-final-form";

type FinalTextFieldProps = TextFieldProps &
  FieldRenderProps<string | number, any> & {
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
  };

export const FinalTextField = ({
  startAdornment,
  endAdornment,
  helperText,
  handleBlur,
  input: { value, onChange, onBlur },
  meta: { touched, error },
  ...rest
}: FinalTextFieldProps) => {
  const showError = touched && !!error;

  const inputProps: Partial<OutlinedInputProps> = {};
  if (startAdornment) {
    inputProps.startAdornment = <InputAdornment position="start">{startAdornment}</InputAdornment>;
  }
  if (endAdornment) {
    inputProps.endAdornment = <InputAdornment position="end">{endAdornment}</InputAdornment>;
  }

  return (
    <TextField
      {...rest}
      fullWidth
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={showError}
      helperText={showError ? error : helperText ? helperText : ""}
      InputLabelProps={{
        shrink: true,
      }}
      margin="dense"
      variant="outlined"
      InputProps={inputProps}
      inputProps={{
        required: false, // bypass html5 required feature
      }}
    />
  );
};
