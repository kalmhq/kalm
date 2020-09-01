import { InputAdornment, OutlinedInputProps, useTheme } from "@material-ui/core";
import TextField, { FilledTextFieldProps, TextFieldProps } from "@material-ui/core/TextField";
import React, { ChangeEvent } from "react";
import { WrappedFieldProps } from "redux-form";
import { KalmConsoleIcon } from "widgets/Icon";
import { withDebounceField, withDebounceProps, inputOnChangeWithDebounce } from "./debounce";
import { TextField as FormikTextField } from "formik-material-ui";
import { FieldProps, getIn } from "formik";

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

export const KRenderFormikTextField = (props: TextFieldProps & FieldProps & { HelperText: React.ReactNode }) => {
  const {
    helperText,
    field: { name },
    form: { touched, errors },
  } = props;

  return (
    <FormikTextField
      {...props}
      InputLabelProps={{
        shrink: true,
      }}
      margin="dense"
      fullWidth
      variant="outlined"
      helperText={(getIn(touched, name) && getIn(errors, name)) || helperText || " "}
      inputProps={{
        required: false, // bypass html5 required feature
      }}
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
  format?: (value: any) => any;
  parse?: (value: any) => any;
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
      label,
      helperText,
      placeholder,
      required,
      disabled,
      type,
      min,
      endAdornment,
      field: { name },
      form: { touched, errors, values, setFieldValue },
      format,
      parse,
    } = this.props;
    const inputProps: Partial<OutlinedInputProps> = {
      inputProps: {
        min,
      },
    };
    if (endAdornment) {
      inputProps.endAdornment = <InputAdornment position="end">{endAdornment}</InputAdornment>;
    }

    const error = getIn(errors, name);
    const showError = !!getIn(errors, name) && !!getIn(touched, name);

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
        defaultValue={format ? format(getIn(values, name)) : getIn(values, name)}
        value={format ? format(getIn(values, name)) : getIn(values, name)}
        onChange={(e) => {
          const value = e.target.value;
          return parse ? setFieldValue(name, parse(value)) : setFieldValue(name, value);
        }}
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
  const showError = !!getIn(errors, name) && !!getIn(touched, name);

  const theme = useTheme();

  return (
    <FormikTextField
      {...props}
      fullWidth
      spellCheck={false}
      helperText={showError ? getIn(errors, name) : helperText ? helperText : ""}
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
    />
  );
};
