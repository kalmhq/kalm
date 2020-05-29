import { makeStyles } from "@material-ui/core/styles";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import { Autocomplete } from "@material-ui/lab";
import clsx from "clsx";
import React from "react";
import { WrappedFieldProps } from "redux-form";

interface RenderTextField {
  label?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  margin?: boolean;
  multiline?: boolean;
  rows?: number;
  rowsMax?: number;
  disabled?: boolean;
  formValueToEditValue?: (value: any) => string;
  editValueToFormValue?: (value: string) => any;
}

export const RenderTextField = ({
  label,
  input,
  placeholder,
  helperText,
  required,
  disabled,
  margin,
  formValueToEditValue,
  editValueToFormValue,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & RenderTextField) => {
  const classes = makeStyles(theme => ({
    noMargin: {
      margin: 0
    }
  }))();

  return (
    <TextField
      classes={{ root: clsx({ [classes.noMargin]: !margin }) }}
      label={label}
      autoComplete="off"
      disabled={disabled}
      required={required}
      error={touched && invalid}
      helperText={(touched && error) || helperText}
      placeholder={placeholder}
      fullWidth
      size="small"
      margin="dense"
      variant="outlined"
      onChange={(event: any) => {
        editValueToFormValue
          ? input.onChange(editValueToFormValue(event.target.value))
          : input.onChange(event.target.value);
      }}
      defaultValue={formValueToEditValue ? formValueToEditValue(input.value) : input.value}
      {...custom}
    />
  );
};

interface AutoCompleteFreeSoloProps {
  label?: string;
  options: string[];
}

export const RenderAutoCompleteFreeSolo = (props: WrappedFieldProps & AutoCompleteFreeSoloProps) => {
  const {
    options,
    input,
    label,
    // helperText,
    meta: { touched, invalid, error }
  } = props;
  return (
    <Autocomplete
      freeSolo
      disableClearable
      options={options.map(option => option)}
      defaultValue={input.value || ""}
      onChange={(event: React.ChangeEvent<{}>, value: string | null) => {
        if (value) {
          input.onChange(value);
        }
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          margin="dense"
          variant="outlined"
          fullWidth
          size="small"
          error={touched && invalid}
          helperText={touched && error}
          // defaultValue={input.value || ""}
          onChange={(event: any) => {
            input.onChange(event.target.value);
          }}
        />
      )}
    />
  );
};

interface AutoCompleteSelectProps {
  label?: string;
  required?: boolean;
  children: React.ReactElement<{ children: string; value: string }>[];
}

export const RenderAutoCompleteSelect = ({ input, label, children }: WrappedFieldProps & AutoCompleteSelectProps) => {
  children = React.Children.toArray(children);

  const options = children.map(item => ({
    text: item.props.children,
    value: item.props.value
  }));

  let selectedOption = options.find(x => x.value === input.value);

  if (!selectedOption) {
    selectedOption = options[0];
  }

  // TODO, if there is no options, we should disabled the add existing disk

  return (
    <Autocomplete
      options={options}
      getOptionLabel={option => option.text}
      value={selectedOption}
      disableClearable
      onChange={(event: React.ChangeEvent<{}>, value: { text: string; value: string } | null) => {
        if (value) {
          input.onChange(value.value);
        }
      }}
      renderInput={params => <TextField {...params} label={label} variant="outlined" fullWidth size="small" />}
    />
  );
};
