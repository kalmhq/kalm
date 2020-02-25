import React from "react";
import { Autocomplete } from "@material-ui/lab";
import { TextField, TextFieldProps } from "@material-ui/core";

interface Props {
  value: string;
  onChange: any;
  options: string[];
  textFieldProps?: TextFieldProps;
}

export const MaterialTableEditAutoComplete = ({ value, onChange, options, textFieldProps, ...rest }: Props) => {
  const hanldeInputChange = (event: React.ChangeEvent<{}>, value: string) => {
    if (!event) return;
    onChange(value);
  };

  const handleOnChange = (_event: React.ChangeEvent<{}>, selectOption: string | null) => {
    if (!selectOption) return;
    onChange(selectOption);
  };

  return (
    <Autocomplete
      options={options}
      disableClearable
      freeSolo
      autoComplete
      inputValue={value}
      onInputChange={hanldeInputChange}
      onChange={handleOnChange}
      renderInput={params => {
        return (
          <TextField
            {...params}
            {...textFieldProps}
            variant="outlined"
            fullWidth
            size="small"
            onKeyPress={event => {
              if (event.key === "Enter") {
                event.preventDefault();
                // TODO, submit the edit form here
              }
            }}
          />
        );
      }}
    />
  );
};
