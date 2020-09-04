import { InputAdornment, OutlinedInputProps, useTheme } from "@material-ui/core";
import TextField, { TextFieldProps } from "@material-ui/core/TextField";
import { FieldProps, getIn } from "formik";
import { TextField as FormikTextField } from "formik-material-ui";
import React, { useState, useEffect, useCallback } from "react";
import { KalmConsoleIcon } from "widgets/Icon";
import { withDebounceField, withDebounceProps, inputOnChangeWithDebounce } from "./debounce";
import { useDebouncedCallback } from "use-debounce";

interface Props {
  endAdornment?: React.ReactNode;
}

export const KRenderFormikTextField = (props: TextFieldProps & FieldProps) => {
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

const INPUT_DELAY = 500;

export const TextFieldWrapper = (props: TextFieldProps & FieldProps & Props & withDebounceProps) => {
  const {
    helperText,
    endAdornment,
    meta,
    field: { name },
    form: { errors, handleChange },
    dispatch,
    showError,
    ...custom
  } = props;
  const [innerValue, setInnerValue] = useState("");

  useEffect(() => {
    if (props.value) {
      setInnerValue(props.value as string);
    } else {
      setInnerValue("");
    }
  }, [props.value]);

  const [debouncedHandleOnChange] = useDebouncedCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    inputOnChangeWithDebounce(dispatch, handleChange, event, name);
  }, INPUT_DELAY);

  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      event.persist();

      const newValue = event.currentTarget.value;
      setInnerValue(newValue);
      debouncedHandleOnChange(event);
    },
    [debouncedHandleOnChange],
  );

  const inputProps: Partial<OutlinedInputProps> = {};
  if (endAdornment) {
    inputProps.endAdornment = <InputAdornment position="end">{endAdornment}</InputAdornment>;
  }

  return (
    <TextField
      {...custom}
      fullWidth
      name={name}
      error={showError}
      InputLabelProps={{
        shrink: true,
      }}
      helperText={showError ? getIn(errors, name) : helperText ? helperText : " "}
      margin="dense"
      variant="outlined"
      InputProps={inputProps}
      inputProps={{
        required: false, // bypass html5 required feature
      }}
      value={innerValue}
      onChange={handleOnChange}
    />
  );
};

export const KRenderDebounceFormikTextField = withDebounceField(TextFieldWrapper);

interface ComplexValueTextFieldProps {
  endAdornment?: React.ReactNode;
  min?: string;
  pattern?: string;
  format?: (value: any) => any;
  parse?: (value: any) => any;
}

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
        // defaultValue={format ? format(getIn(values, name)) : getIn(values, name)}
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
