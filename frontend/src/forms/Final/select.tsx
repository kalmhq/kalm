import { Box, FormControl, InputLabel, makeStyles, MenuItem, Select, SelectProps, Typography } from "@material-ui/core";
import FormHelperText from "@material-ui/core/FormHelperText";
import React from "react";
import { FieldRenderProps } from "react-final-form";
import { ID } from "utils";

type FinalSelectFieldProps = FieldRenderProps<string> &
  SelectProps & {
    options: {
      text: React.ReactNode;
      desc?: string;
      value: string;
      selectedText?: string;
      disabled?: boolean;
    }[];
    helperText?: any;
  };

const renderFormHelper = ({ touched, error, helperText }: any) => {
  if (!(touched && error)) {
    return <FormHelperText>{helperText || ""}</FormHelperText>;
  } else {
    return <FormHelperText>{touched && error}</FormHelperText>;
  }
};

export const FinalSelectField = ({
  options,
  label,
  autoFocus,
  meta: { touched, error },
  input: { value, onChange, onBlur },
  disabled,
}: FinalSelectFieldProps) => {
  const id = ID();
  const labelId = ID();

  const classes = makeStyles((theme) => ({
    root: {
      display: "flex",
    },
  }))();

  const [labelWidth, setLabelWidth] = React.useState(0);

  React.useEffect(() => {
    setLabelWidth(inputLabel.current!.offsetWidth);
  }, []);

  const inputLabel = React.useRef<HTMLLabelElement>(null);

  return (
    <FormControl
      classes={{ root: classes.root }}
      error={touched && error}
      variant="outlined"
      size="small"
      style={{ pointerEvents: "auto" }}
      margin="dense"
    >
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId}>
        {label}
      </InputLabel>
      <Select
        disabled={disabled}
        label={label}
        labelWidth={labelWidth}
        autoFocus={autoFocus}
        labelId={labelId}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        renderValue={(value: any) => {
          const option = options.find((x) => x.value === value);

          if (!option) {
            return value;
          }

          if (option.selectedText) {
            return option.selectedText;
          }

          return option.text;
        }}
        inputProps={{ id }}
      >
        {options &&
          options.map((option) => {
            return (
              <MenuItem value={option.value} key={option.value}>
                {option.desc ? (
                  <Box pt={1} pb={1}>
                    <Typography color="textPrimary">{option.text}</Typography>
                    <Typography color="textSecondary" variant="caption">
                      {option.desc}
                    </Typography>
                  </Box>
                ) : (
                  option.text
                )}
              </MenuItem>
            );
          })}
      </Select>

      {renderFormHelper({ touched, error })}
    </FormControl>
  );
};

interface KSelectProps {
  options: {
    text: React.ReactNode;
    value: string;
    selectedText?: string;
    disabled?: boolean;
  }[];
}

export const KSelect = ({ options, label, autoFocus, value, onChange, onBlur }: SelectProps & KSelectProps) => {
  const id = ID();
  const labelId = ID();

  const classes = makeStyles((theme) => ({
    root: {
      display: "flex",
    },
  }))();

  const [labelWidth, setLabelWidth] = React.useState(0);

  React.useEffect(() => {
    setLabelWidth(inputLabel.current!.offsetWidth);
  }, []);

  const inputLabel = React.useRef<HTMLLabelElement>(null);

  return (
    <FormControl
      classes={{ root: classes.root }}
      variant="outlined"
      size="small"
      style={{ pointerEvents: "auto" }}
      margin="dense"
    >
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId}>
        {label}
      </InputLabel>
      <Select
        label={label}
        labelWidth={labelWidth}
        autoFocus={autoFocus}
        labelId={labelId}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        renderValue={(value: any) => {
          const option = options.find((x) => x.value === value);

          if (!option) {
            return value;
          }

          if (option.selectedText) {
            return option.selectedText;
          }

          return option.text;
        }}
        inputProps={{
          id: id,
        }}
      >
        {options &&
          options.map((option) => {
            return (
              <MenuItem value={option.value} key={option.value}>
                {option.text}
              </MenuItem>
            );
          })}
      </Select>
    </FormControl>
  );
};

/**
 * Helper method to generate a single option for a select input
 * @param value
 * @param itemName
 * @param itemDesc
 */
export const makeSelectOption = (value: string, itemName: string, itemDesc: string) => {
  return {
    value,
    selectedText: itemName,
    text: (
      <Box pt={1} pb={1}>
        <Typography color="textPrimary">{itemName}</Typography>
        <Typography color="textSecondary" variant="caption">
          {itemDesc}
        </Typography>
      </Box>
    ),
  };
};
