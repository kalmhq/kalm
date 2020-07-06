import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  makeStyles,
  MenuItem,
  Select,
  SelectProps,
  Tooltip,
} from "@material-ui/core";
import FormHelperText from "@material-ui/core/FormHelperText";
import React from "react";
import { WrappedFieldMetaProps, WrappedFieldProps } from "redux-form";
import { ID } from "utils";

const renderFormHelper = ({ touched, error }: Pick<WrappedFieldMetaProps, "touched" | "error">) => {
  if (!(touched && error)) {
    return;
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
}

export const RenderSelectField = ({
  options,
  input,
  label,
  autoFocus,
  disabled,
  meta: { touched, error },
  children,
}: WrappedFieldProps & SelectProps & Props) => {
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

  // const onChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>, child: React.ReactNode) => {
  //   input.onChange(event.target.value);
  // };

  let value = input.value;

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
        disabled={disabled}
        label={label}
        labelWidth={labelWidth}
        autoFocus={autoFocus}
        labelId={labelId}
        value={value}
        onChange={(e) => input.onChange(e.target.value)}
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
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export const RenderMutipleSelectField = ({
  input,
  label,
  options,
  autoFocus,
  meta: { touched, error },
}: WrappedFieldProps & SelectProps & { options: { text: string; value: string; tooltipTitle?: string }[] }) => {
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

  const onChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>, child: React.ReactNode) => {
    input.onChange(event.target.value);
  };

  return (
    <FormControl
      classes={{ root: classes.root }}
      error={touched && error}
      variant="outlined"
      size="small"
      margin="dense"
    >
      {/* https://material-ui.com/zh/api/input-label/#css */}
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId} classes={{ root: classes.inputLabel }}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        labelWidth={labelWidth}
        multiple
        value={input.value}
        onChange={onChange}
        autoFocus={autoFocus}
        onBlur={input.onBlur}
        renderValue={(selected) => (selected as string[]).join(", ")}
        MenuProps={MenuProps}
      >
        {options.map((option) => {
          return (
            <MenuItem key={option.value} value={option.value}>
              <Checkbox checked={input.value.indexOf(option.value) > -1} />
              {option.tooltipTitle ? (
                <Tooltip arrow title={option.tooltipTitle} key={option.value}>
                  <ListItemText primary={option.text} />
                </Tooltip>
              ) : (
                <ListItemText primary={option.text} />
              )}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};
