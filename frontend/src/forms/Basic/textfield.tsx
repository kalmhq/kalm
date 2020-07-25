import { InputAdornment, OutlinedInputProps } from "@material-ui/core";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import React, { ChangeEvent } from "react";
import { WrappedFieldProps } from "redux-form";
import { KalmConsoleIcon } from "widgets/Icon";
import { withDebounceField, withDebounceProps, inputOnChangeWithDebounce } from "./debounce";

interface Props {
  endAdornment?: React.ReactNode;
}

// value type is string
export class KRenderTextField extends React.PureComponent<withDebounceProps & Props> {
  render() {
    const {
      input,
      label,
      helperText,
      placeholder,
      required,
      disabled,
      autoFocus,
      type,
      endAdornment,
      multiline,
      rows,
      meta,
      meta: { error, form, touched },
      showError,
      dispatch,
      ...custom
    } = this.props;
    const inputProps: Partial<OutlinedInputProps> = {};
    const defaultShowError = !!error && touched;
    if (endAdornment) {
      inputProps.endAdornment = <InputAdornment position="end">{endAdornment}</InputAdornment>;
    }

    return (
      <TextField
        {...custom}
        fullWidth
        label={label}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        error={showError || defaultShowError}
        type={type}
        multiline={multiline}
        rows={rows}
        autoFocus={autoFocus}
        onFocus={input.onFocus}
        onBlur={input.onBlur}
        InputLabelProps={{
          shrink: true,
        }}
        helperText={showError || defaultShowError ? error : helperText ? helperText : " "}
        margin="dense"
        variant="outlined"
        InputProps={inputProps}
        inputProps={{
          required: false, // bypass html5 required feature
        }}
        value={input.value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          inputOnChangeWithDebounce(input.onChange, event.target.value, form, input.name);
        }}
      />
    );
  }
}

export const KRenderDebounceTextField = withDebounceField(KRenderTextField);

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
        shrink: true,
      }}
      InputProps={{
        rows: 4,
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
  endAdornment?: React.ReactNode;
  formValueToEditValue?: (value: any) => string;
  editValueToFormValue?: (value: string) => any;
}

// value type is complex like array or json, like "command" is array, but using textfield input
export class RenderComplexValueTextField extends React.PureComponent<withDebounceProps & ComplexValueTextFieldProps> {
  render() {
    const {
      input,
      label,
      helperText,
      placeholder,
      required,
      disabled,
      type,
      endAdornment,
      formValueToEditValue,
      editValueToFormValue,
      meta: { error, touched },
      showError,
    } = this.props;
    const defaultShowError = !!error && touched;
    const inputProps: Partial<OutlinedInputProps> = {};
    if (endAdornment) {
      inputProps.endAdornment = <InputAdornment position="end">{endAdornment}</InputAdornment>;
    }

    return (
      <TextField
        type={type}
        InputProps={inputProps}
        fullWidth
        label={label}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        error={showError || defaultShowError}
        helperText={showError || defaultShowError ? error : helperText ? helperText : ""}
        InputLabelProps={{
          shrink: true,
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
  }
}

export const RenderComplexValueTextDebounceField = withDebounceField(RenderComplexValueTextField);

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
        shrink: true,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <KalmConsoleIcon color={"default"} />
          </InputAdornment>
        ),
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
