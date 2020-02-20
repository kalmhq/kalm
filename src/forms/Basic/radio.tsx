import React from "react";
import Radio from "@material-ui/core/Radio";
import RadioGroup, { RadioGroupProps } from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { Field } from "redux-form/immutable";
import { WrappedFieldProps, BaseFieldProps } from "redux-form";
import FormControl from "@material-ui/core/FormControl";

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

const renderRadioGroup = ({
  input,
  name,
  options,
  ...rest
}: RadioGroupProps & WrappedFieldProps & Props) => {
  return (
    <RadioGroup
      aria-label={name}
      name={name}
      value={input.value}
      onChange={(event, value) => input.onChange(value)}
    >
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
