import { InputAdornment, OutlinedInputProps, useTheme } from "@material-ui/core";
import TextField, { TextFieldProps } from "@material-ui/core/TextField";
import { FieldProps, getIn } from "formik";
import { TextField as FormikTextField } from "formik-material-ui";
import throttle from "lodash/throttle";
import React, { useCallback, useEffect, useState } from "react";
import { KalmConsoleIcon } from "widgets/Icon";
import { isNumber } from "util";

interface Props {
  endAdornment?: React.ReactNode;
  normalize?: (event: React.ChangeEvent<HTMLInputElement>) => any;
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

export const KRenderThrottleFormikTextField = (props: TextFieldProps & FieldProps & Props) => {
  const {
    helperText,
    endAdornment,
    onBlur,
    normalize,
    field: { name, value },
    form: { errors, touched, handleBlur, setFieldValue },
    ...custom
  } = props;
  const [innerValue, setInnerValue] = useState("");
  const error = getIn(errors, name);
  const showError = !!getIn(errors, name) && !!getIn(touched, name);

  useEffect(() => {
    if (value || isNumber(value)) {
      setInnerValue(String(value));
    } else {
      setInnerValue("");
    }
  }, [value]);

  const throttleOnChangeCallback = useCallback(
    throttle(
      (newValue: any) => {
        setFieldValue(name, newValue);
      },
      1000,
      { leading: true, trailing: true },
    ),
    [],
  );

  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      event.persist();

      const newValue = normalize ? normalize(event) : event.currentTarget.value;
      setInnerValue(newValue);
      throttleOnChangeCallback(newValue);
    },
    [throttleOnChangeCallback, normalize],
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
      onBlur={onBlur || handleBlur}
      error={showError}
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
      value={innerValue}
      onChange={handleOnChange}
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
      field: { name, value },
      form: { touched, errors, setFieldValue, setFieldTouched },
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
        value={format ? format(value) : value}
        onBlur={(e) => {
          setFieldTouched(name, true);
        }}
        onChange={(e) => {
          const value = e.target.value;
          parse ? setFieldValue(name, parse(value)) : setFieldValue(name, value);
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
