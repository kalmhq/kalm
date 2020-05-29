import { FormLabel } from "@material-ui/core";
import FormControl, { FormControlProps } from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import React from "react";
import { WrappedFieldProps } from "redux-form";
import { Caption } from "../../widgets/Label";

interface KRadioGroupRenderOption {
  value: string;
  label: string;
  explain?: string;
}
interface KRadioGroupRenderProps extends WrappedFieldProps {
  options: KRadioGroupRenderOption[];
  title?: string;
  formControlProps?: FormControlProps;
}

export const KRadioGroupRender = ({ input, meta, title, options, formControlProps }: KRadioGroupRenderProps) => {
  const { error } = meta;

  return (
    <FormControl component="fieldset" fullWidth margin="dense" error={error}>
      {title ? <FormLabel component="legend">{title}</FormLabel> : null}
      <RadioGroup aria-label="gender" name="gender1" value={input.value} onChange={input.onChange}>
        {options.map(option => {
          return (
            <>
              <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
              {option.explain ? <Caption style={{ padding: "0 16px 0 32px" }}>{option.explain}</Caption> : null}
            </>
          );
        })}
      </RadioGroup>
    </FormControl>
  );
};
