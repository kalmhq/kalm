import {
  Chip,
  createStyles,
  Divider,
  OutlinedTextFieldProps,
  TextField,
  Theme,
  Typography,
  withStyles,
} from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import {
  Autocomplete,
  createFilterOptions,
  UseAutocompleteMultipleProps,
  UseAutocompleteSingleProps,
} from "@material-ui/lab";
import { AutocompleteProps, RenderGroupParams } from "@material-ui/lab/Autocomplete/Autocomplete";
import { WithStyles } from "@material-ui/styles";
import clsx from "clsx";
import { FieldProps, getIn } from "formik";
import Immutable from "immutable";
import React, { useState } from "react";
import { BaseFieldProps, WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { theme } from "theme/theme";
import { ID } from "utils";
import { KalmApplicationIcon, KalmLogoIcon } from "widgets/Icon";
import { Caption } from "widgets/Label";

export interface KFreeSoloAutoCompleteMultiValuesProps<T>
  extends WrappedFieldProps,
    WithStyles<typeof KFreeSoloAutoCompleteMultiValuesStyles>,
    UseAutocompleteMultipleProps<T>,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText"> {
  InputLabelProps?: {};
  disabled?: boolean;
  icons?: Immutable.List<any>;
}

const KFreeSoloAutoCompleteMultiValuesStyles = (theme: Theme) =>
  createStyles({
    root: {},
    error: {
      color: theme.palette.error.main,
      border: "1px solid " + theme.palette.error.main,
    },
  });

// input value is Immutable.List<string>
const KFreeSoloAutoCompleteMultiValuesRaw = (props: KFreeSoloAutoCompleteMultiValuesProps<string>) => {
  const {
    input,
    label,
    options,
    helperText,
    meta: { touched, invalid, error, active },
    classes,
    placeholder,
    InputLabelProps,
    disabled,
    icons,
  } = props;

  const errors = error as (string | undefined)[] | undefined | string;
  const errorsIsArray = Array.isArray(errors);
  const errorsArray = errors as (string | undefined)[];
  let errorText: string | undefined = undefined;

  if (touched && invalid && errorsIsArray && !active) {
    errorText = errorsArray.find((x) => x !== undefined);
  }

  if (typeof errors === "string" && !active) {
    errorText = errors;
  }

  const id = ID();

  // input value is not in store or state, when props changed, will clear.
  // so, use state here to prevent clearing
  // issue here: https://github.com/mui-org/material-ui/issues/19423#issuecomment-641463808
  const [inputText, setInputText] = useState("");

  return (
    <Autocomplete
      disabled={disabled}
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
      value={input.value}
      onChange={(_event: React.ChangeEvent<{}>, values) => {
        if (values) {
          input.onChange(values);
          if (values.length !== 0) {
            setInputText("");
          }
        }
      }}
      inputValue={inputText}
      onInputChange={(event, value, reason) => {
        if (reason === "input") {
          setInputText(value);
        }
      }}
      renderTags={(value: string[], getTagProps) => {
        return value.map((option: string, index: number) => {
          return (
            <Chip
              icon={icons ? icons.get(index) : undefined}
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
            error={touched && invalid && !active}
            label={label}
            InputLabelProps={InputLabelProps}
            placeholder={placeholder}
            helperText={(touched && invalid && errorText) || helperText}
          />
        );
      }}
    />
  );
};

export const KFreeSoloAutoCompleteMultiValues = withStyles(KFreeSoloAutoCompleteMultiValuesStyles)(
  KFreeSoloAutoCompleteMultiValuesRaw,
);

export interface KAutoCompleteSingleValueProps<T>
  extends WrappedFieldProps,
    WithStyles<typeof KAutoCompleteSingleValueStyles>,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText">,
    Pick<AutocompleteProps<T>, "noOptionsText">,
    UseAutocompleteSingleProps<T> {}

const KAutoCompleteSingleValueStyles = (_theme: Theme) =>
  createStyles({
    root: {},
    groupLabel: {
      background: theme.palette.type === "light" ? theme.palette.grey[50] : theme.palette.background.paper,
      borderBottom: `1px solid ${theme.palette.divider}`,
      paddingLeft: 12,
      display: "flex",
      alignItems: "center",
      fontSize: theme.typography.subtitle2.fontSize,
      textTransform: "capitalize",
      paddingTop: 4,
      paddingBottom: 4,
    },
    groupLabelDefault: {
      background: theme.palette.type === "light" ? theme.palette.grey[50] : theme.palette.background.paper,
      borderBottom: `1px solid ${theme.palette.divider}`,
      paddingLeft: 12,
      display: "flex",
      alignItems: "center",
      fontSize: theme.typography.subtitle2.fontSize,
      textTransform: "capitalize",
      paddingTop: 4,
      paddingBottom: 4,
    },
    groupLabelCurrent: {
      color: theme.palette.type === "light" ? theme.palette.primary.dark : theme.palette.primary.light,
      fontWeight: 500,
    },
    groupIcon: {
      marginRight: theme.spacing(1),
    },
    logoIcon: {
      marginRight: theme.spacing(2),
      color:
        theme.palette.type === "light" ? theme.palette.getContrastText(grey[700]) : theme.palette.background.default,
      background: theme.palette.type === "light" ? grey[700] : "#FFFFFF",
    },

    groupUl: {
      marginLeft: 32,
    },
  });

export interface KAutoCompleteOption {
  value: string;
  label: string;
  group: string;
}

function KFreeSoloAutoCompleteSingleValueRaw<T>(
  props: KAutoCompleteSingleValueProps<KAutoCompleteOption>,
): JSX.Element {
  const {
    input,
    label,
    helperText,
    meta: { touched, invalid, error },
    classes,
    options,
    placeholder,
  } = props;

  return (
    <Autocomplete
      classes={classes}
      freeSolo
      openOnFocus
      groupBy={(option) => option.group}
      // size="small"
      options={options}
      filterOptions={createFilterOptions({
        ignoreCase: true,
        matchFrom: "any",
        stringify: (option) => {
          return option.label;
        },
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
      renderInput={(params) => {
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
  KFreeSoloAutoCompleteSingleValueRaw,
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
    noOptionsText,
  } = props;

  const value = options.find((x) => x.value === input.value) || null;

  const { groupLabelDefault, groupIcon, logoIcon, groupLabelCurrent, ...autocompleteClasses } = classes;

  return (
    <Autocomplete
      classes={autocompleteClasses}
      openOnFocus
      noOptionsText={noOptionsText}
      groupBy={(option) => option.group}
      options={options}
      size="small"
      filterOptions={createFilterOptions({
        ignoreCase: true,
        matchFrom: "any",
        stringify: (option) => {
          return option.label;
        },
      })}
      renderGroup={(group: RenderGroupParams) => {
        if (group.key === "default") {
          return (
            <div key={group.key}>
              <div className={groupLabelDefault}>
                <KalmLogoIcon className={clsx(groupIcon, logoIcon)} />
                <Caption>{group.key}</Caption>
              </div>
              {group.children}
              <Divider />
            </div>
          );
        } else {
          return (
            <div key={group.key}>
              <div className={classes.groupLabel}>
                <KalmApplicationIcon className={groupIcon} />
                <Caption className={clsx(group.key.includes("Current") ? groupLabelCurrent : {})}>{group.key}</Caption>
              </div>
              {group.children}
              <Divider />
            </div>
          );
        }
      }}
      renderOption={(option: KAutoCompleteOption) => {
        return (
          <div className={classes.groupUl}>
            <Typography>{option.label}</Typography>
          </div>
        );
      }}
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
      renderInput={(params) => {
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

type CommonOutlinedTextFiedlProps = Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText">;
interface KAutoCompleteMultipleSelectProps<T>
  extends WrappedFieldProps,
    UseAutocompleteMultipleProps<T>,
    CommonOutlinedTextFiedlProps {}

const KAutoCompleteMultipleSelect = (props: KAutoCompleteMultipleSelectProps<KAutoCompleteOption>) => {
  const {
    placeholder,
    input,
    label,
    helperText,
    options,
    meta: { error, touched, invalid },
  } = props;

  return (
    <Autocomplete
      multiple
      size="small"
      options={options}
      filterSelectedOptions
      openOnFocus
      groupBy={(option): string => option.group}
      filterOptions={createFilterOptions({
        ignoreCase: true,
        matchFrom: "any",
        stringify: (option): string => {
          return option.value;
        },
      })}
      getOptionLabel={(option): string => {
        return option.label;
      }}
      renderTags={(value, getTagProps) => {
        return value.map((option, index: number) => {
          return <Chip variant="outlined" label={option.label} size="small" {...getTagProps({ index })} />;
        });
      }}
      onFocus={input.onFocus}
      onBlur={(e) => {
        (input.onBlur as any)();
      }}
      value={input.value}
      onChange={(_event: React.ChangeEvent<{}>, values) => {
        input.onChange(values);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          InputLabelProps={{
            shrink: true,
          }}
          label={label}
          variant="outlined"
          placeholder={placeholder}
          error={touched && invalid}
          helperText={(touched && invalid && error) || helperText}
        />
      )}
    />
  );
};

interface KAutoCompleteMultipleSelectFieldProps
  extends Pick<BaseFieldProps, "validate" | "name">,
    CommonOutlinedTextFiedlProps {
  options: KAutoCompleteOption[];
}

// value Immutable.List<string>
export const KAutoCompleteMultipleSelectField = (props: KAutoCompleteMultipleSelectFieldProps) => {
  const { options } = props;

  return (
    <Field
      component={KAutoCompleteMultipleSelect}
      format={(value: Immutable.List<string>, name: string): KAutoCompleteOption[] => {
        const res: KAutoCompleteOption[] = [];
        value.forEach((v) => {
          const findResult = options.find((o) => o.value === v);

          if (findResult) {
            res.push(findResult);
          } else {
            res.push({
              label: v,
              value: v,
              group: "",
            });
          }
        });
        return res;
      }}
      parse={(value: KAutoCompleteOption[], name: string) => {
        if (value === undefined) return undefined; // bypass blur set value
        return Immutable.List(value.map((v) => v.value));
      }}
      {...props}
    />
  );
};

interface KFreeSoloAutoCompleteMultipleSelectFieldProps
  extends Pick<BaseFieldProps, "validate" | "name" | "normalize">,
    CommonOutlinedTextFiedlProps {
  options?: string[];
  icons?: Immutable.List<JSX.Element | undefined>;
  disabled?: boolean;
  multiline?: boolean;
  className?: string;
  rows?: number;
}

const KFreeSoloAutoCompleteMultipleSelectFieldFormat = (value: any) => {
  return Immutable.isCollection(value) ? value.toArray() : value;
};

const KFreeSoloAutoCompleteMultipleSelectFieldParse = (values: any[]) => {
  if (values === undefined) return undefined; // bypass blur set value
  return Immutable.List(values);
};

export const KFreeSoloAutoCompleteMultipleSelectStringField = (
  props: KFreeSoloAutoCompleteMultipleSelectFieldProps,
) => {
  return (
    <Field
      InputLabelProps={{
        shrink: true,
      }}
      margin="normal"
      component={KFreeSoloAutoCompleteMultiValues}
      // constant won't cause rerender
      format={KFreeSoloAutoCompleteMultipleSelectFieldFormat}
      parse={KFreeSoloAutoCompleteMultipleSelectFieldParse}
      {...props}
    />
  );
};

export interface KFreeSoloFormikAutoCompleteMultiValuesProps<T>
  extends FieldProps,
    UseAutocompleteMultipleProps<T>,
    WithStyles<typeof KFreeSoloAutoCompleteMultiValuesStyles>,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText"> {
  InputLabelProps?: {};
  disabled?: boolean;
  icons?: any[];
}

export const KFreeSoloFormikAutoCompleteMultiValues = withStyles(KFreeSoloAutoCompleteMultiValuesStyles)(
  (props: KFreeSoloFormikAutoCompleteMultiValuesProps<string>) => {
    const {
      id,
      label,
      options,
      icons,
      field: { name },
      form: { touched, errors, setFieldValue, handleBlur, values },
      placeholder,
      helperText,
      classes,
    } = props;

    const errorsIsArray = Array.isArray(getIn(errors, name));
    const errorsArray = getIn(errors, name) as (string | undefined)[];
    let errorText: string | undefined = undefined;

    if (getIn(touched, name) && errorsIsArray) {
      errorText = errorsArray.find((x) => x !== undefined);
    }

    if (typeof getIn(errors, name) === "string") {
      errorText = getIn(errors, name) as string;
    }
    return (
      <Autocomplete
        // {...props}
        options={options || []}
        multiple
        autoSelect
        clearOnEscape
        freeSolo
        size="small"
        id={id}
        onBlur={handleBlur}
        value={getIn(values, name)}
        onChange={(e, value) => {
          setFieldValue(name, value);
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
              error={!!getIn(touched, name) && !!errorText}
              label={label}
              placeholder={placeholder}
              helperText={(getIn(touched, name) && errorText) || helperText}
            />
          );
        }}
      />
    );
  },
);

// formik single value
export interface KFormikAutoCompleteSingleValueProps<T>
  extends FieldProps,
    WithStyles<typeof KAutoCompleteSingleValueStyles>,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText">,
    Pick<AutocompleteProps<T>, "noOptionsText">,
    UseAutocompleteSingleProps<T> {}

function KFormikAutoCompleteSingleValueRaw<T>(
  props: KFormikAutoCompleteSingleValueProps<KAutoCompleteOption>,
): JSX.Element {
  const {
    label,
    helperText,
    field: { name },
    form: { touched, errors, setFieldValue, handleBlur, values },
    classes,
    options,
    placeholder,
    noOptionsText,
  } = props;

  const value = options.find((x) => x.value === getIn(values, name)) || null;

  const { groupLabelDefault, groupIcon, logoIcon, groupLabelCurrent, ...autocompleteClasses } = classes;

  return (
    <Autocomplete
      classes={autocompleteClasses}
      openOnFocus
      noOptionsText={noOptionsText}
      groupBy={(option) => option.group}
      options={options}
      size="small"
      filterOptions={createFilterOptions({
        ignoreCase: true,
        matchFrom: "any",
        stringify: (option) => {
          return option.label;
        },
      })}
      renderGroup={(group: RenderGroupParams) => {
        if (group.key === "default") {
          return (
            <div key={group.key}>
              <div className={groupLabelDefault}>
                <KalmLogoIcon className={clsx(groupIcon, logoIcon)} />
                <Caption>{group.key}</Caption>
              </div>
              {group.children}
              <Divider />
            </div>
          );
        } else {
          return (
            <div key={group.key}>
              <div className={classes.groupLabel}>
                <KalmApplicationIcon className={groupIcon} />
                <Caption className={clsx(group.key.includes("Current") ? groupLabelCurrent : {})}>{group.key}</Caption>
              </div>
              {group.children}
              <Divider />
            </div>
          );
        }
      }}
      renderOption={(option: KAutoCompleteOption) => {
        return (
          <div className={classes.groupUl}>
            <Typography>{option.label}</Typography>
          </div>
        );
      }}
      value={value}
      getOptionLabel={(option: KAutoCompleteOption) => option.label}
      onBlur={handleBlur}
      forcePopupIcon={true}
      onChange={(_event: any, value: KAutoCompleteOption | null) => {
        if (value) {
          setFieldValue(name, value.value);
        } else {
          setFieldValue(name, "");
        }
      }}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            fullWidth
            variant="outlined"
            error={!!(getIn(touched, name) && getIn(errors, name))}
            label={label}
            placeholder={placeholder}
            helperText={(getIn(touched, name) && getIn(errors, name)) || helperText}
          />
        );
      }}
    />
  );
}

export const KFormikAutoCompleteSingleValue = withStyles(KAutoCompleteSingleValueStyles)(
  KFormikAutoCompleteSingleValueRaw,
);
