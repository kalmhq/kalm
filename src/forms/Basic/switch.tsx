import React from "react";
import { WrappedFieldProps } from "redux-form";
import { FormControlLabel, FormControlLabelProps, Switch } from "@material-ui/core";

export const SwitchField = ({
  input,
  formControlLabelProps,
  ...props
}: WrappedFieldProps & {
  formControlLabelProps: FormControlLabelProps;
}) => {
  const handleChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void = event => {
    input.onChange(!input.value);
  };

  return (
    <FormControlLabel
      {...formControlLabelProps}
      control={<Switch checked={input.value} onChange={handleChange} color="primary" />}
    />
  );
};
