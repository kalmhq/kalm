import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  SelectProps,
  makeStyles,
  MenuItem,
  Checkbox,
  ListItemText,
  Tooltip
} from "@material-ui/core";
import { EditComponentProps } from "material-table";
import { ID } from "../../utils";
import { WrappedFieldProps, WrappedFieldMetaProps } from "redux-form";
import FormHelperText from "@material-ui/core/FormHelperText";
import Input from "antd/es/input";

export const MaterialTableEditSelectField = ({
  value,
  onChange,
  selectProps,
  children
}: EditComponentProps<{}> & { selectProps: SelectProps; children?: React.ReactNode }) => {
  const id = ID();
  const labelId = ID();

  const classes = makeStyles(_theme => ({
    root: {
      display: "flex"
    }
  }))();

  const [labelWidth, setLabelWidth] = React.useState(0);

  React.useEffect(() => {
    setLabelWidth(inputLabel.current!.offsetWidth);
  }, []);

  const inputLabel = React.useRef<HTMLLabelElement>(null);

  const handleOnChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>, child: React.ReactNode) => {
    onChange(event.target.value);
  };

  return (
    <FormControl classes={{ root: classes.root }} variant="outlined" size="small">
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId}>
        {selectProps.label}
      </InputLabel>
      <Select
        labelWidth={labelWidth}
        autoFocus={false}
        labelId={labelId}
        defaultValue={value}
        value={value}
        onChange={handleOnChange}
        inputProps={{
          id: id
        }}>
        {children}
      </Select>
    </FormControl>
  );
};

const renderFormHelper = ({ touched, error }: Pick<WrappedFieldMetaProps, "touched" | "error">) => {
  if (!(touched && error)) {
    return;
  } else {
    return <FormHelperText>{touched && error}</FormHelperText>;
  }
};

export const ReduxFormSelectField = ({
  input,
  label,
  autoFocus,
  meta: { touched, error },
  children
}: WrappedFieldProps & SelectProps) => {
  const id = ID();
  const labelId = ID();
  const classes = makeStyles(theme => ({
    root: {
      display: "flex"
    }
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
      margin="normal">
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId}>
        {label}
      </InputLabel>
      <Select
        label={label}
        labelWidth={labelWidth}
        autoFocus={autoFocus}
        labelId={labelId}
        value={input.value}
        onChange={onChange}
        onBlur={input.onBlur}
        inputProps={{
          id: id
        }}>
        {children}
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
      width: 250
    }
  }
};

export const ReduxFormMutipleSelectField = ({
  input,
  label,
  options,
  autoFocus,
  meta: { touched, error }
}: WrappedFieldProps & SelectProps & { options: { text: string; value: string; tooltipTitle?: string }[] }) => {
  const id = ID();
  const labelId = ID();
  const classes = makeStyles(theme => ({
    root: {
      display: "flex"
    }
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
      margin="normal">
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId}>
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
        renderValue={selected => (selected as string[]).join(", ")}
        MenuProps={MenuProps}>
        {options.map(option => {
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
