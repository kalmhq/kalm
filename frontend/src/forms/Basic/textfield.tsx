import { InputAdornment } from "@material-ui/core";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import React, { ChangeEvent } from "react";
import { WrappedFieldProps } from "redux-form";
import { KappConsoleIcon } from "../../widgets/Icon";

interface Props {
  endAdornment?: React.ReactNode;
}

// value type is string
export const KRenderTextField = ({
  input,
  label,
  helperText,
  placeholder,
  required,
  disabled,
  endAdornment,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & Props) => {
  const showError = !!error && touched;

  return (
    <TextField
      fullWidth
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      error={showError}
      InputLabelProps={{
        shrink: true
      }}
      helperText={showError ? error : helperText ? helperText : ""}
      margin="dense"
      variant="outlined"
      InputProps={{
        endAdornment: <InputAdornment position="end">{endAdornment}</InputAdornment>
      }}
      value={input.value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => input.onChange(event.target.value)}
    />
  );
};

export const KRenderTextareaField = ({
  input,
  label,
  helperText,
  placeholder,
  required,
  disabled,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & Props) => {
  const showError = !!error && touched;

  return (
    <TextField
      fullWidth
      multiline
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      error={showError}
      InputLabelProps={{
        shrink: true
      }}
      InputProps={{
        rows: 4
      }}
      helperText={showError ? error : helperText ? helperText : ""}
      margin="dense"
      variant="outlined"
      value={input.value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => input.onChange(event.target.value)}
    />
  );
};

interface ComplexValueTextFieldProps {
  formValueToEditValue?: (value: any) => string;
  editValueToFormValue?: (value: string) => any;
}
// value type is complex like array or json, like "command" is array, but using textfield input
export const RenderComplexValueTextField = ({
  input,
  label,
  helperText,
  placeholder,
  required,
  disabled,
  formValueToEditValue,
  editValueToFormValue,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & ComplexValueTextFieldProps) => {
  const showError = !!error && touched;

  return (
    <TextField
      fullWidth
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      error={showError}
      helperText={showError ? error : helperText ? helperText : ""}
      InputLabelProps={{
        shrink: true
      }}
      margin="dense"
      variant="outlined"
      onChange={(event: any) => {
        editValueToFormValue
          ? input.onChange(editValueToFormValue(event.target.value))
          : input.onChange(event.target.value);
      }}
      defaultValue={formValueToEditValue ? formValueToEditValue(input.value) : input.value}
      // {...custom}
    />
  );
};

export const KRenderCommandTextField = ({
  input,
  label,
  helperText,
  placeholder,
  required,
  disabled,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & ComplexValueTextFieldProps) => {
  const showError = !!error && touched;

  return (
    <TextField
      fullWidth
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      error={showError}
      helperText={showError ? error : helperText ? helperText : ""}
      InputLabelProps={{
        shrink: true
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <KappConsoleIcon />
          </InputAdornment>
        )
      }}
      margin="dense"
      variant="outlined"
      onChange={(event: any) => {
        input.onChange(event.target.value);
      }}
      value={input.value}
      // {...custom}
    />
  );
};
