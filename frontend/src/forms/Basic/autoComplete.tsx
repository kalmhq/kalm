import { Chip, createStyles, OutlinedTextFieldProps, TextField, Theme, withStyles } from "@material-ui/core";
import { Autocomplete, UseAutocompleteMultipleProps } from "@material-ui/lab";
import { WithStyles } from "@material-ui/styles";
import clsx from "clsx";
import { FieldProps, getIn } from "formik";
import React from "react";

const KFreeSoloAutoCompleteMultiValuesStyles = (theme: Theme) =>
  createStyles({
    root: {},
    error: {
      color: theme.palette.error.main,
      border: "1px solid " + theme.palette.error.main,
    },
  });

export interface KFreeSoloFormikAutoCompleteMultiValuesProps<T>
  extends FieldProps,
    UseAutocompleteMultipleProps<T>,
    WithStyles<typeof KFreeSoloAutoCompleteMultiValuesStyles>,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText"> {
  InputLabelProps?: {};
  disabled?: boolean;
  icons?: any[];
  normalize?: any;
}

export const KFreeSoloFormikAutoCompleteMultiValues = withStyles(KFreeSoloAutoCompleteMultiValuesStyles)(
  (props: KFreeSoloFormikAutoCompleteMultiValuesProps<string>) => {
    const {
      id,
      label,
      options,
      icons,
      disabled,
      field: { name, value },
      form: { errors, setFieldValue },
      placeholder,
      helperText,
      classes,
      normalize,
    } = props;

    const errorsIsArray = Array.isArray(getIn(errors, name));
    const errorsArray = getIn(errors, name) as (string | undefined)[];
    let errorText: string | undefined = undefined;

    if (errorsIsArray) {
      errorText = errorsArray.find((x) => x !== undefined);
    }

    if (typeof getIn(errors, name) === "string") {
      errorText = getIn(errors, name) as string;
    }

    // input value is not in store or state, when props changed, will clear.
    // so, use state here to prevent clearing
    // issue here: https://github.com/mui-org/material-ui/issues/19423#issuecomment-641463808
    const [inputText, setInputText] = React.useState("");

    return (
      <Autocomplete
        // {...props}
        options={options || []}
        multiple
        autoSelect
        clearOnEscape
        freeSolo
        disabled={disabled}
        size="small"
        id={id}
        onBlur={(e) => {
          if (!value || value.length === 0) {
            if (inputText) {
              setFieldValue(name, normalize ? [normalize(inputText.trim())] : [inputText.trim()]);
            }
          }
        }}
        value={value}
        onChange={(e, value) => {
          setFieldValue(name, normalize ? normalize(value.map((v) => v.trim())) : value.map((v) => v.trim()));

          if (value.length !== 0) {
            setInputText("");
          }
        }}
        inputValue={inputText}
        onInputChange={(_, value, reason) => {
          if (reason === "input") {
            setInputText(value);
          }
        }}
        // @ts-ignore
        renderTags={(value: string[], getTagProps) => {
          return value.map((option: string, index: number) => {
            return (
              <Chip
                icon={icons ? icons[index] : undefined}
                variant="outlined"
                label={option}
                classes={{ root: clsx({ [classes.error]: errorsIsArray && errorsArray[index] }) }}
                size="small"
                {...getTagProps({ index })}
              />
            );
          });
        }}
        renderInput={(params) => {
          return (
            <TextField
              {...params}
              margin="dense"
              variant="outlined"
              disabled={disabled}
              error={!!errorText}
              label={label}
              placeholder={placeholder}
              helperText={errorText || helperText}
              InputLabelProps={{
                shrink: true,
              }}
            />
          );
        }}
      />
    );
  },
);
