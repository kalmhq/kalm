import React from "react";
import { WrappedFieldProps } from "redux-form";
import { Box, FormControlLabel, FormControlLabelProps, Icon, Switch, Tooltip, TooltipProps } from "@material-ui/core";

export const SwitchField = ({
  input,
  formControlLabelProps,
  tooltipProps,
  ...props
}: WrappedFieldProps & {
  formControlLabelProps: FormControlLabelProps;
  tooltipProps: TooltipProps;
  disabled?: boolean;
}) => {
  const handleChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void = (event) => {
    input.onChange(!input.value);
  };
  let label = formControlLabelProps.label;

  if (tooltipProps) {
    label = (
      <Box display="flex" alignItems="center">
        {formControlLabelProps.label}
        <Icon style={{ marginLeft: 6 }}>help_outline</Icon>
      </Box>
    );
  }

  const content = (
    <FormControlLabel
      {...formControlLabelProps}
      label={label}
      control={<Switch disabled={props.disabled} checked={!!input.value} onChange={handleChange} color="primary" />}
    />
  );

  if (tooltipProps && tooltipProps.title) {
    return <Tooltip {...tooltipProps}>{content}</Tooltip>;
  } else {
    return content;
  }
};
