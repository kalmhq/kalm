import { Box, FormControl, InputLabel, makeStyles, MenuItem, Select, SelectProps, Typography } from "@material-ui/core";
import FormHelperText from "@material-ui/core/FormHelperText";
import { FieldProps, getIn } from "formik";
import { Select as FormikSelect } from "formik-material-ui";
import React from "react";
import { ID } from "utils";

const renderFormHelper = ({ touched, error, helperText }: any) => {
  if (!(touched && error)) {
    return <FormHelperText>{helperText || ""}</FormHelperText>;
  } else {
    return <FormHelperText>{touched && error}</FormHelperText>;
  }
};

export const SelectField = ({
  options,
  label,
  autoFocus,
  value,
  onChange,
  onBlur,
  meta: { touched, error },
}: SelectProps & Props & { meta: { touched: boolean; error: any } }) => {
  const id = ID();
  const labelId = ID();

  const classes = makeStyles((theme) => ({
    root: {
      display: "flex",
    },
    inputLabel: {
      fontWeight: 500,
      fontSize: 13,
    },
  }))();

  const [labelWidth, setLabelWidth] = React.useState(0);

  React.useEffect(() => {
    setLabelWidth(inputLabel.current!.offsetWidth);
  }, []);

  const inputLabel = React.useRef<HTMLLabelElement>(null);

  // select doesn't support endAdornment
  // tooltip doesn't work in FormControl
  // https://stackoverflow.com/questions/60384230/tooltip-inside-textinput-label-is-not-working-material-ui-react
  return (
    <FormControl
      classes={{ root: classes.root }}
      error={touched && error}
      variant="outlined"
      size="small"
      style={{ pointerEvents: "auto" }}
      margin="dense"
    >
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId} classes={{ root: classes.inputLabel }}>
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

      {renderFormHelper({ touched, error })}
    </FormControl>
  );
};

interface Props {
  options: { text: React.ReactNode; value: string; selectedText?: string }[];
  helperText?: any;
}

// const ITEM_HEIGHT = 48;
// const ITEM_PADDING_TOP = 8;
// const MenuProps = {
//   PaperProps: {
//     style: {
//       maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
//       width: 250,
//     },
//   },
// };

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

export const RenderFormikSelectField = (props: FieldProps & SelectProps & Props) => {
  const {
    options,
    label,
    field: { name },
    form: { touched, errors },
  } = props;
  const id = ID();
  const labelId = ID();
  const classes = makeStyles((theme) => ({
    root: {
      display: "flex",
    },
    inputLabel: {
      fontWeight: 500,
      fontSize: 13,
    },
  }))();
  const inputLabel = React.useRef<HTMLLabelElement>(null);

  const { helperText, field, ...formikSelectProps } = props;
  if (field.value === undefined) {
    field.value = "";
  }

  return (
    <FormControl
      classes={{ root: classes.root }}
      error={!!getIn(touched, name) && !!getIn(errors, name)}
      variant="outlined"
      size="small"
      style={{ pointerEvents: "auto" }}
      margin="dense"
    >
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId} classes={{ root: classes.inputLabel }}>
        {label}
      </InputLabel>
      <FormikSelect
        field={field}
        {...formikSelectProps}
        labelId={labelId}
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
                {option.text}
              </MenuItem>
            );
          })}
      </FormikSelect>

      {renderFormHelper({ touched: !!getIn(touched, name), error: getIn(errors, name), helperText })}
    </FormControl>
  );
};
