import { InputAdornment, OutlinedInputProps } from "@material-ui/core";
import TextField, { TextFieldProps } from "@material-ui/core/TextField";
import { FieldProps, getIn } from "formik";
import throttle from "lodash/throttle";
import React, { useCallback, useEffect, useState } from "react";
import { isNumber } from "util";

interface Props {
  endAdornment?: React.ReactNode;
  normalize?: (event: React.ChangeEvent<HTMLInputElement>) => any;
}

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

  const handleBlurCallback = useCallback(
    (event: React.FocusEvent<any>) => {
      const newValue = normalize ? normalize(event) : event.currentTarget.value;
      setInnerValue(newValue);
      setFieldValue(name, newValue);
      if (onBlur) {
        onBlur(event);
      } else {
        handleBlur(event);
      }
    },
    [handleBlur, name, normalize, onBlur, setFieldValue],
  );

  return (
    <TextField
      {...custom}
      fullWidth
      name={name}
      onBlur={handleBlurCallback}
      error={showError}
      InputLabelProps={{
        shrink: true,
      }}
      helperText={showError ? error : helperText ? helperText : ""}
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
