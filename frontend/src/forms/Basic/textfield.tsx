import { InputAdornment, OutlinedInputProps, useTheme } from "@material-ui/core";
import TextField, { FilledTextFieldProps, TextFieldProps } from "@material-ui/core/TextField";
import React, { ChangeEvent } from "react";
import { WrappedFieldProps } from "redux-form";
import { KalmConsoleIcon } from "widgets/Icon";
import { withDebounceField, withDebounceProps, inputOnChangeWithDebounce } from "./debounce";
import { TextField as FormikTextField } from "formik-material-ui";
import { FieldProps } from "formik";

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
      meta: { error, form },
      showError,
      dispatch,
      ...custom
    } = this.props;
    const inputProps: Partial<OutlinedInputProps> = {};
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
        error={showError}
        type={type}
        multiline={multiline}
        rows={rows}
        autoFocus={autoFocus}
        onFocus={input.onFocus}
        onBlur={input.onBlur}
        InputLabelProps={{
          shrink: true,
        }}
        helperText={showError ? error : helperText ? helperText : " "}
        margin="dense"
        variant="outlined"
        InputProps={inputProps}
        inputProps={{
          required: false, // bypass html5 required feature
        }}
        value={input.value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          inputOnChangeWithDebounce(dispatch, input.onChange, event.target.value, form, input.name);
        }}
      />
    );
  }
}

export const KRenderDebounceTextField = withDebounceField(KRenderTextField);

export const KRenderFormikTextField = (props: TextFieldProps & FieldProps) => {
  const {
    helperText,
    field: { name },
    form: { touched, errors },
  } = props;
  const showError = !!errors[name] && !!touched[name];
  return (
    <FormikTextField
      InputLabelProps={{
        shrink: true,
      }}
      error={showError}
      margin="dense"
      fullWidth
      variant="outlined"
      helperText={showError ? errors[name] : helperText ? helperText : " "}
      inputProps={{
        required: false, // bypass html5 required feature
      }}
      {...props}
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
  min?: string;
  pattern?: string;
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
      min,
      endAdornment,
      meta: { error },
      showError,
    } = this.props;
    const inputProps: Partial<OutlinedInputProps> = {
      inputProps: {
        min,
      },
    };
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
        error={showError}
        helperText={showError ? error : helperText ? helperText : ""}
        InputLabelProps={{
          shrink: true,
        }}
        margin="dense"
        variant="outlined"
        onChange={(event: any) => {
          input.onChange(event.target.value);
        }}
        defaultValue={input.value}
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

  const theme = useTheme();

  return (
    <TextField
      fullWidth
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      error={showError}
      spellCheck={false}
      helperText={showError ? error : helperText ? helperText : ""}
      InputLabelProps={{
        shrink: true,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <KalmConsoleIcon color={theme.palette.type === "light" ? "default" : "inherit"} />
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

export class RenderFormikComplexValueTextField extends React.PureComponent<
  TextFieldProps & FieldProps & ComplexValueTextFieldProps
> {
  render() {
    const {
      min,
      endAdornment,
      field: { name },
      form: { errors, touched },
      helperText,
    } = this.props;
    const inputProps: Partial<OutlinedInputProps> = {
      inputProps: {
        min,
      },
    };
    if (endAdornment) {
      inputProps.endAdornment = <InputAdornment position="end">{endAdornment}</InputAdornment>;
    }

    return (
      <FormikTextField
        {...this.props}
        InputProps={inputProps}
        fullWidth
        helperText={!!touched[name] && !!errors[name] ? errors[name] : helperText ? helperText : " "}
        InputLabelProps={{
          shrink: true,
        }}
        margin="dense"
        variant="outlined"
      />
    );
  }
}

export const KRenderFormikCommandTextField = (props: TextFieldProps & FieldProps & ComplexValueTextFieldProps) => {
  const {
    helperText,
    field: { name },
    form: { touched, errors },
  } = props;
  const showError = !!errors[name] && !!touched[name];

  const theme = useTheme();

  return (
    <FormikTextField
      fullWidth
      error={showError}
      spellCheck={false}
      helperText={showError ? errors[name] : helperText ? helperText : ""}
      InputLabelProps={{
        shrink: true,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <KalmConsoleIcon color={theme.palette.type === "light" ? "default" : "inherit"} />
          </InputAdornment>
        ),
      }}
      margin="dense"
      variant="outlined"
      {...props}
    />
  );
};
