import { FormLabel } from "@material-ui/core";
import FormControl, { FormControlProps } from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import RadioGroup, { RadioGroupProps } from "@material-ui/core/RadioGroup";
import React from "react";
import { BaseFieldProps, WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";

interface KRadioGroupRenderOption {
  value: string;
  label: string;
}
interface KRadioGroupRenderProps extends WrappedFieldProps {
  options: KRadioGroupRenderOption[];
  title?: string;
  formControlProps?: FormControlProps;
}

export const KRadioGroupRender = ({ input, meta, title, options, formControlProps }: KRadioGroupRenderProps) => {
  const { error } = meta;

  return (
    <FormControl component="fieldset" fullWidth margin="normal" error={error}>
      {title ? <FormLabel component="legend">{title}</FormLabel> : null}
      <RadioGroup aria-label="gender" name="gender1" value={input.value} onChange={input.onChange}>
        {options.map(option => (
          <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
        ))}
      </RadioGroup>
    </FormControl>
  );
};

interface Props {
  name: string;
  label: string;
  options: string[];
}

export const CustomRadioGroup = (props: BaseFieldProps & Props) => {
  return (
    <FormControl component="fieldset" margin="normal">
      {/* <FormLabel component="legend" style={{ marginBottom: "8px" }}>
        {props.label}
      </FormLabel> */}
      <Field {...props} component={renderRadioGroup} />
    </FormControl>
  );
};

const renderRadioGroup = ({ input, name, options, ...rest }: RadioGroupProps & WrappedFieldProps & Props) => {
  return (
    <RadioGroup aria-label={name} name={name} value={input.value} onChange={(event, value) => input.onChange(value)}>
      {options.map(option => (
        <FormControlLabel
          key={option}
          value={option}
          control={<Radio color="primary" />}
          label={option.toUpperCase()}
        />
      ))}
      {/* <FormControlLabel value="female" control={<Radio />} label="Female" />
    <FormControlLabel value="male" control={<Radio />} label="Male" /> */}
    </RadioGroup>
  );
};
