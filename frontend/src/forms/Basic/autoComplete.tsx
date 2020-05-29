import { Chip, createStyles, OutlinedTextFieldProps, PropTypes, TextField, Theme, withStyles } from "@material-ui/core";
import {
  Autocomplete,
  createFilterOptions,
  UseAutocompleteMultipleProps,
  UseAutocompleteSingleProps
} from "@material-ui/lab";
import { WithStyles } from "@material-ui/styles";
import clsx from "clsx";
import Immutable from "immutable";
import React from "react";
import { WrappedFieldProps } from "redux-form";
import { ID } from "../../utils";
import { AutocompleteProps } from "@material-ui/lab/Autocomplete/Autocomplete";

export interface ReduxFormMultiTagsFreeSoloAutoCompleteProps
  extends WrappedFieldProps,
    WithStyles<typeof styles>,
    Pick<OutlinedTextFieldProps, "placeholder"> {}

const styles = (_theme: Theme) =>
  createStyles({
    root: {}
  });

const capitalize = (s: string): string => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const ReduxFormMultiTagsFreeSoloAutoCompleteRaw = (props: ReduxFormMultiTagsFreeSoloAutoCompleteProps) => {
  const {
    input,
    meta: { touched, invalid, error },
    classes,
    placeholder
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
      // it the value is a Immutable.List, change it to an array
      value={Immutable.isCollection(input.value) ? input.value.toArray() : input.value}
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
            margin="dense"
            variant="outlined"
            error={touched && invalid}
            label={capitalize(input.name)}
            placeholder={placeholder}
            helperText={touched && invalid && errorText}
          />
        );
      }}
    />
  );
};

export const ReduxFormMultiTagsFreeSoloAutoComplete = withStyles(styles)(ReduxFormMultiTagsFreeSoloAutoCompleteRaw);

export interface KFreeSoloAutoCompleteMultiValuesProps<T>
  extends WrappedFieldProps,
    WithStyles<typeof KFreeSoloAutoCompleteMultiValuesStyles>,
    UseAutocompleteMultipleProps<T>,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText"> {}

const KFreeSoloAutoCompleteMultiValuesStyles = (theme: Theme) =>
  createStyles({
    root: {},
    error: {
      color: theme.palette.error.main,
      border: "1px solid " + theme.palette.error.main
    }
  });

// input value is Immutable.List<string>
const KFreeSoloAutoCompleteMultiValuesRaw = (props: KFreeSoloAutoCompleteMultiValuesProps<string>) => {
  const {
    input,
    label,
    options,
    helperText,
    meta: { touched, invalid, error },
    classes,
    placeholder
  } = props;

  const errors = error as (string | undefined)[] | undefined | string;
  const errorsIsArray = Array.isArray(errors);
  const errorsArray = errors as (string | undefined)[];
  let errorText: string | undefined = undefined;

  if (touched && invalid && errorsIsArray) {
    errorText = errorsArray.find(x => x !== undefined);
  }

  if (typeof errors === "string") {
    errorText = errors;
  }

  const id = ID();

  return (
    <Autocomplete
      multiple
      autoSelect
      clearOnEscape
      freeSolo
      id={id}
      size="small"
      options={options || []}
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
      value={Immutable.isCollection(input.value) ? input.value.toArray() : input.value}
      onChange={(_event: React.ChangeEvent<{}>, values) => {
        if (values) {
          input.onChange(Immutable.List(values));
        }
      }}
      onInputChange={() => {}}
      renderTags={(value: string[], getTagProps) => {
        return value.map((option: string, index: number) => {
          return (
            <Chip
              variant="outlined"
              label={option}
              classes={{ root: clsx({ [classes.error]: errorsIsArray && errorsArray[index] }) }}
              size="small"
              {...getTagProps({ index })}
            />
          );
        });
      }}
      renderInput={params => {
        return (
          <TextField
            {...params}
            margin="dense"
            variant="outlined"
            error={touched && invalid}
            label={label}
            placeholder={placeholder}
            helperText={(touched && invalid && errorText) || helperText}
          />
        );
      }}
    />
  );
};

export const KFreeSoloAutoCompleteMultiValues = withStyles(KFreeSoloAutoCompleteMultiValuesStyles)(
  KFreeSoloAutoCompleteMultiValuesRaw
);

export interface KAutoCompleteSingleValueProps<T>
  extends WrappedFieldProps,
    WithStyles<typeof KAutoCompleteSingleValueStyles>,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText">,
    Pick<AutocompleteProps<T>, "noOptionsText">,
    UseAutocompleteSingleProps<T> {}

const KAutoCompleteSingleValueStyles = (_theme: Theme) =>
  createStyles({
    root: {}
  });

export interface KAutoCompleteOption {
  value: string;
  label: string;
  group: string;
}

function KFreeSoloAutoCompleteSingleValueRaw<T>(
  props: KAutoCompleteSingleValueProps<KAutoCompleteOption>
): JSX.Element {
  const {
    input,
    label,
    helperText,
    meta: { touched, invalid, error },
    classes,
    options,
    placeholder
  } = props;

  return (
    <Autocomplete
      classes={classes}
      freeSolo
      openOnFocus
      groupBy={option => option.group}
      // size="small"
      options={options}
      filterOptions={createFilterOptions({
        matchFrom: "any",
        stringify: option => option.value
      })}
      getOptionLabel={(option: any) => {
        if (option.label) {
          return option.label;
        } else {
          return option;
        }
      }}
      onFocus={input.onFocus}
      onBlur={input.onBlur}
      // onBlur={() => {
      //   // https://github.com/redux-form/redux-form/issues/2768
      //   //
      //   // If a redux-form field has normilazer, the onBlur will triger normalizer.
      //   // This component is complex since the real values is not the input element value.
      //   // So if the blur event is trigger, it will set input value(wrong value) as the autocomplete value
      //   // As a result, Field that is using this component mush not set a normalizer.
      //   (input.onBlur as any)();
      // }}
      // value={input.value}
      forcePopupIcon={true}
      onInputChange={(_event: any, value: string) => {
        input.onChange(value);
      }}
      // onInputChange={(...args: any[]) => {
      // console.log("onInputChange", args);
      // }}
      // onSelect={(...args: any[]) => {
      //   console.log("onSelect", args);
      //   return true;
      // }}
      // onChange={(...args: any[]) => {
      //   console.log("onChange", args);
      //   return true;
      // }}
      renderInput={params => {
        return (
          <TextField
            {...params}
            fullWidth
            variant="outlined"
            error={touched && invalid}
            label={label}
            placeholder={placeholder}
            helperText={(touched && invalid && error) || helperText}
          />
        );
      }}
    />
  );
}

export const KFreeSoloAutoCompleteSingleValue = withStyles(KAutoCompleteSingleValueStyles)(
  KFreeSoloAutoCompleteSingleValueRaw
);

function KAutoCompleteSingleValueRaw<T>(props: KAutoCompleteSingleValueProps<KAutoCompleteOption>): JSX.Element {
  const {
    input,
    label,
    helperText,
    meta: { touched, invalid, error },
    classes,
    options,
    placeholder,
    noOptionsText
  } = props;

  const value = options.find(x => x.value === input.value) || null;

  return (
    <Autocomplete
      classes={classes}
      openOnFocus
      noOptionsText={noOptionsText}
      groupBy={option => option.group}
      options={options}
      filterOptions={createFilterOptions({
        matchFrom: "any",
        stringify: option => option.value
      })}
      value={value}
      getOptionLabel={(option: KAutoCompleteOption) => option.label}
      onFocus={input.onFocus}
      onBlur={() => {
        (input.onBlur as any)();
      }}
      forcePopupIcon={true}
      onChange={(_event: any, value: KAutoCompleteOption | null) => {
        if (value) {
          input.onChange(value.value);
        } else {
          input.onChange("");
        }
      }}
      renderInput={params => {
        return (
          <TextField
            {...params}
            fullWidth
            variant="outlined"
            error={touched && invalid}
            label={label}
            placeholder={placeholder}
            helperText={(touched && invalid && error) || helperText}
          />
        );
      }}
    />
  );
}

export const KAutoCompleteSingleValue = withStyles(KAutoCompleteSingleValueStyles)(KAutoCompleteSingleValueRaw);
