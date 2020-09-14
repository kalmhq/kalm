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
import React from "react";
import { theme } from "theme/theme";
import { KalmApplicationIcon, KalmLogoIcon } from "widgets/Icon";
import { Caption } from "widgets/Label";

const KFreeSoloAutoCompleteMultiValuesStyles = (theme: Theme) =>
  createStyles({
    root: {},
    error: {
      color: theme.palette.error.main,
      border: "1px solid " + theme.palette.error.main,
    },
  });

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
      disabled,
      field: { name, value },
      form: { touched, errors, setFieldValue, handleBlur },
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
        disabled={disabled}
        size="small"
        id={id}
        onBlur={handleBlur}
        value={value}
        onChange={(e, value) => {
          setFieldValue(
            name,
            value.map((v) => v.trim()),
          );
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
    field: { name, value: fieldValue },
    form: { touched, errors, setFieldValue, handleBlur },
    classes,
    options,
    placeholder,
    noOptionsText,
  } = props;

  const value = options.find((x) => x.value === fieldValue) || null;

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

interface KFormikAutoCompleteMultipleSelectFieldProps<T>
  extends FieldProps,
    UseAutocompleteMultipleProps<T>,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText"> {
  InputLabelProps?: {};
  disabled?: boolean;
  icons?: any[];
}

export const KFormikAutoCompleteMultipleSelectField = (props: KFormikAutoCompleteMultipleSelectFieldProps<string>) => {
  const {
    placeholder,
    label,
    helperText,
    options,
    field: { name, value },
    form: { touched, errors, setFieldValue, handleBlur },
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
      renderTags={(value: string[], getTagProps) => {
        return value.map((option: string, index: number) => {
          return <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} />;
        });
      }}
      onBlur={handleBlur}
      value={value}
      onChange={(e, value) => {
        setFieldValue(
          name,
          value.map((option) => option.value),
        );
      }}
      renderInput={(params) => (
        <TextField
          name={name}
          {...params}
          InputLabelProps={{
            shrink: true,
          }}
          label={label}
          variant="outlined"
          placeholder={placeholder}
          error={!!touched[name] && !!errors[name]}
          helperText={helperText}
        />
      )}
    />
  );
};
