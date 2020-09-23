import { InputAdornment, OutlinedInputProps } from "@material-ui/core";
import TextField, { TextFieldProps } from "@material-ui/core/TextField";
import React from "react";
import { FieldRenderProps } from "react-final-form";

type FinalTextFieldProps = TextFieldProps &
  FieldRenderProps<string | number, any> & {
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
    htmlType?: string;
  };

export const FinalTextField = ({
  startAdornment,
  endAdornment,
  helperText,
  handleBlur,
  input: { value, onChange, onBlur },
  meta: { touched, error, submitError },
  htmlType,
  ...rest
}: FinalTextFieldProps) => {
  const showError = touched && (!!error || !!submitError);

  const inputProps: Partial<OutlinedInputProps> = {};
  if (startAdornment) {
    inputProps.startAdornment = <InputAdornment position="start">{startAdornment}</InputAdornment>;
  }
  if (endAdornment) {
    inputProps.endAdornment = <InputAdornment position="end">{endAdornment}</InputAdornment>;
  }

  const onBlurCallback = React.useCallback(
    (e) => {
      handleBlur && handleBlur(e); // custom handleBlur eg. Ports close popupState
      onBlur(e);
    },
    [onBlur, handleBlur],
  );

  return (
    <TextField
      {...rest}
      type={htmlType}
      fullWidth
      value={value}
      onChange={onChange}
      onBlur={onBlurCallback}
      error={showError}
      helperText={showError ? error || submitError : helperText ? helperText : ""}
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
