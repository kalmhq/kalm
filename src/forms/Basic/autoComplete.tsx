import React from "react";
import { Autocomplete } from "@material-ui/lab";
import { TextField, TextFieldProps, Chip, withStyles, Theme, createStyles, PropTypes } from "@material-ui/core";
import { WrappedFieldProps } from "redux-form";
import { WithStyles } from "@material-ui/styles";
import { ID } from "../../utils";

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

export interface ReduxFormMultiTagsFreeSoloAutoCompleteProps extends WrappedFieldProps, WithStyles<typeof styles> {}

const styles = (_theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
      "& .MuiFormControl-root": {
        width: "100%"
      }
    }
  });

const capitalize = (s: string): string => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const ReduxFormMultiTagsFreeSoloAutoCompleteRaw = (props: ReduxFormMultiTagsFreeSoloAutoCompleteProps) => {
  const {
    input,
    meta: { touched, invalid, error },
    classes
  } = props;

  // TODO defualt hosts
  // const hosts: string[] = [""];
  const hosts: string[] = [];

  const errors = error as (string | undefined)[] | string;
  const errorsIsArray = Array.isArray(errors);

  let errorText: string | undefined = undefined;

  if (touched && invalid) {
    if (!errorsIsArray) {
      errorText = errors as string;
    } else {
      errorText = (errors as (string | undefined)[]).find(x => x !== undefined);
    }
  }

  const id = ID();

  return (
    <Autocomplete
      classes={classes}
      multiple
      autoSelect
      clearOnEscape
      freeSolo
      id={id}
      size="small"
      options={hosts}
      onFocus={input.onFocus}
      onBlur={() => {
        // https://github.com/redux-form/redux-form/issues/2768
        //
        // If a redux-form field has normilazer, the onBlur will triger normalizer.
        // This component is complex since the real values is not the input element value.
        // So if the blur event is trigger, it will set input value(wrong value) as the autocomplete value
        // As a result, Field that is using this component mush not set a normalizer.
        (input.onBlur as any)();
      }}
      onChange={(_event: React.ChangeEvent<{}>, values) => {
        if (values) {
          input.onChange(values);
        }
      }}
      onInputChange={() => {}}
      renderTags={(value: string[], getTagProps) =>
        value.map((option: string, index: number) => {
          let color: PropTypes.Color = "default";

          if (errorsIsArray && errors[index]) {
            color = "secondary";
          }

          return <Chip variant="outlined" label={option} size="small" color={color} {...getTagProps({ index })} />;
        })
      }
      renderInput={params => {
        return (
          <TextField
            {...params}
            variant="outlined"
            error={touched && invalid}
            label={capitalize(input.name)}
            placeholder="Hosts"
            helperText={touched && invalid && errorText}
          />
        );
      }}
    />
  );
};

export const ReduxFormMultiTagsFreeSoloAutoComplete = withStyles(styles)(ReduxFormMultiTagsFreeSoloAutoCompleteRaw);
