import React from "react";
import { WrappedFieldProps } from "redux-form";
import {
  FormControlLabel,
  Switch,
  FormControlLabelProps
} from "@material-ui/core";

export const SwitchField = ({
  input,
  formControlLabelProps
}: WrappedFieldProps & {
  formControlLabelProps: FormControlLabelProps;
}) => {
  const handleChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void = event => {
    input.onChange(event.target.value);
  };

  return (
    <FormControlLabel
      {...formControlLabelProps}
      control={
        <Switch checked={input.value} onChange={handleChange} color="primary" />
      }
    />
  );
};
