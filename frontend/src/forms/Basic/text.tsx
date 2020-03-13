import { OutlinedTextFieldProps, TextField as MTextField, TextFieldProps } from "@material-ui/core";
import { EditComponentProps } from "material-table";
import React from "react";
import { WrappedFieldProps } from "redux-form";

export const TextField = ({
  input,
  meta: { touched, invalid, error },
  ...textFieldProps
}: WrappedFieldProps & Partial<OutlinedTextFieldProps>) => {
  return (
    <MTextField
      // style={{ margin: 0 }}
      {...textFieldProps}
      autoComplete="off"
      error={touched && invalid}
      helperText={(touched && error) || textFieldProps.helperText}
      fullWidth
      size="small"
      margin="normal"
      variant="outlined"
      onChange={(event: any) => input.onChange(event.target.value)}
      value={input.value}
    />
  );
};

export const TextFieldChangeOnBlur = ({
  input,
  meta: { touched, invalid, error },
  ...textFieldProps
}: WrappedFieldProps & Partial<OutlinedTextFieldProps>) => {
  const [value, setValue] = React.useState(input.value);

  const handleBlure = (event: any) => {
    input.onChange(value);
    input.onBlur(event);
  };

  const handleChange = (event: any) => {
    setValue(event.target.value);
  };

  return (
    <MTextField
      style={{ margin: 0 }}
      {...textFieldProps}
      autoComplete="off"
      error={touched && invalid}
      helperText={(touched && error) || textFieldProps.helperText}
      fullWidth
      size="small"
      margin="normal"
      variant="outlined"
      onChange={handleChange}
      value={value}
      onBlur={handleBlure}
    />
  );
};

export const MaterialTableEditTextField = ({
  value,
  onChange,
  textFieldProps
}: {
  textFieldProps?: TextFieldProps;
} & EditComponentProps<{}>) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <MTextField
      {...textFieldProps}
      style={{ margin: 0 }}
      autoComplete="off"
      fullWidth
      size="small"
      margin="normal"
      variant="outlined"
      onChange={handleChange}
      value={value || ""}
      onKeyPress={event => {
        if (event.key === "Enter") {
          event.preventDefault();

          // TODO, submit the edit form here
        }
      }}
    />
  );
};
