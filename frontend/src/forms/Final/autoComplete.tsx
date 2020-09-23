import { OutlinedTextFieldProps, TextField, Theme } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { AutocompleteProps, UseAutocompleteMultipleProps, UseAutocompleteSingleProps } from "@material-ui/lab";
import clsx from "clsx";
import React from "react";
import { theme } from "theme/theme";
import { FieldRenderProps } from "react-final-form";
import Chip from "@material-ui/core/Chip";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Autocomplete from "@material-ui/lab/Autocomplete";

const FreeSoloStyles = makeStyles((theme: Theme) => ({
  root: {},
  error: {
    color: theme.palette.error.main,
    border: "1px solid " + theme.palette.error.main,
  },
}));

export const SelectStyles = makeStyles((_theme: Theme) => ({
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
    color: theme.palette.type === "light" ? theme.palette.getContrastText(grey[700]) : theme.palette.background.default,
    background: theme.palette.type === "light" ? grey[700] : "#FFFFFF",
  },

  groupUl: {
    marginLeft: 32,
  },
}));

export interface AutoCompleteMultiValuesFreeSoloProps<T>
  extends FieldRenderProps<T[]>,
    Omit<UseAutocompleteMultipleProps<T>, "multiple">,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText"> {
  InputLabelProps?: {};
  disabled?: boolean;
  icons?: any[];
  normalize?: any;
}

interface X {
  <T>(props: AutoCompleteMultiValuesFreeSoloProps<T>): JSX.Element;
}

export const AutoCompleteMultiValuesFreeSolo: X = function <T>(props: AutoCompleteMultiValuesFreeSoloProps<T>) {
  const {
    id,
    label,
    options,
    icons,
    disabled,
    input: { value, onBlur },
    meta: { error },
    placeholder,
    helperText,
  } = props;

  const classes = FreeSoloStyles();
  const errorsIsArray = Array.isArray(error);

  let errorText: string | undefined = undefined;

  if (errorsIsArray) {
    errorText = error.find((x: string | undefined) => x !== undefined);
  }

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(x) => (x as any).toString()}
      multiple
      autoSelect
      clearOnEscape
      freeSolo
      disabled={disabled}
      size="small"
      id={id}
      onBlur={onBlur}
      value={value || []}
      onChange={(_, value) => {
        onChange(value);
      }}
      renderTags={(value, getTagProps) => {
        return value.map((option, index: number) => {
          return (
            <Chip
              icon={icons ? icons[index] : undefined}
              variant="outlined"
              label={option}
              classes={{ root: clsx({ [classes.error]: errorsIsArray && error[index] }) }}
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
};

export interface AutoCompleteSingleValueProps<T>
  extends FieldRenderProps<T>,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText">,
    Pick<AutocompleteProps<T>, "noOptionsText">,
    UseAutocompleteSingleProps<T> {}

// export const AutoCompleteSingleValue = function <T>(
//   props: AutoCompleteSingleValueProps<KAutoCompleteOption>,
// ): JSX.Element {
//   const {
//     label,
//     helperText,
//     field: { name, value: fieldValue },
//     form: { touched, errors, setFieldValue, handleBlur },
//     classes,
//     options,
//     placeholder,
//     noOptionsText,
//   } = props;
//
//   const value = options.find((x) => x.value === fieldValue) || null;
//
//   const { groupLabelDefault, groupIcon, logoIcon, groupLabelCurrent, ...autocompleteClasses } = classes;
//
//   return (
//     <Autocomplete
//       classes={autocompleteClasses}
//       openOnFocus
//       noOptionsText={noOptionsText}
//       groupBy={(option) => option.group}
//       options={options}
//       size="small"
//       filterOptions={createFilterOptions({
//         ignoreCase: true,
//         matchFrom: "any",
//         stringify: (option) => {
//           return option.label;
//         },
//       })}
//       renderGroup={(group: RenderGroupParams) => {
//         if (group.key === "default") {
//           return (
//             <div key={group.key}>
//               <div className={groupLabelDefault}>
//                 <KalmLogoIcon className={clsx(groupIcon, logoIcon)} />
//                 <Caption>{group.key}</Caption>
//               </div>
//               {group.children}
//               <Divider />
//             </div>
//           );
//         } else {
//           return (
//             <div key={group.key}>
//               <div className={classes.groupLabel}>
//                 <KalmApplicationIcon className={groupIcon} />
//                 <Caption className={clsx(group.key.includes("Current") ? groupLabelCurrent : {})}>{group.key}</Caption>
//               </div>
//               {group.children}
//               <Divider />
//             </div>
//           );
//         }
//       }}
//       renderOption={(option: KAutoCompleteOption) => {
//         return (
//           <div className={classes.groupUl}>
//             <Typography>{option.label}</Typography>
//           </div>
//         );
//       }}
//       value={value}
//       getOptionLabel={(option: KAutoCompleteOption) => option.label}
//       onBlur={handleBlur}
//       forcePopupIcon={true}
//       onChange={(_event: any, value: KAutoCompleteOption | null) => {
//         if (value) {
//           setFieldValue(name, value.value);
//         } else {
//           setFieldValue(name, "");
//         }
//       }}
//       renderInput={(params) => {
//         return (
//           <TextField
//             {...params}
//             fullWidth
//             variant="outlined"
//             error={!!(getIn(touched, name) && getIn(errors, name))}
//             label={label}
//             placeholder={placeholder}
//             helperText={(getIn(touched, name) && getIn(errors, name)) || helperText}
//           />
//         );
//       }}
//     />
//   );
// };

interface AutoCompleteMultipleValuesProps<T>
  extends FieldRenderProps<T[]>,
    Omit<UseAutocompleteMultipleProps<T>, "multiple">,
    Pick<OutlinedTextFieldProps, "placeholder" | "label" | "helperText"> {
  InputLabelProps?: {};
  disabled?: boolean;
  icons?: any[];
}

export const AutoCompleteMultipleValueField = (props: AutoCompleteMultipleValuesProps<string>) => {
  const {
    placeholder,
    label,
    helperText,
    options,
    input: { name, onChange, value, onBlur },
    meta: { touched, error },
  } = props;

  return (
    <Autocomplete
      multiple
      size="small"
      options={options}
      // filterSelectedOptions
      openOnFocus
      // groupBy={(option): string => option.group}
      // renderGroup={({ key, children }) => (
      //   <div>
      //     {key}
      //     {children}
      //   </div>
      // )}
      // renderOption={(value) => {
      //   return <div>{value}</div>;
      // }}
      // filterOptions={createFilterOptions({
      //   ignoreCase: true,
      //   matchFrom: "any",
      //   stringify: (option): string => {
      //     return option.value;
      //   },
      // })}
      // getOptionLabel={(option): string => {
      //   return option.label;
      // }}
      renderTags={(value: string[], getTagProps) => {
        return value.map((option: string, index: number) => {
          return <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} />;
        });
      }}
      onBlur={onBlur}
      value={value}
      onChange={(e, value) => {
        onChange(value);
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
          error={!!touched && !!error}
          helperText={helperText}
        />
      )}
    />
  );
};
