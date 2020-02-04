import React, { HtmlHTMLAttributes } from "react";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import {
  Field,
  WrappedFieldProps,
  BaseFieldProps,
  WrappedFieldMetaProps
} from "redux-form";
import { FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import FormHelperText from "@material-ui/core/FormHelperText";
import { ID } from "../../utils";
import { makeStyles } from "@material-ui/core/styles";

export const renderTextField = ({
  label,
  input,
  placeholder,
  helperText,
  required,
  disabled,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & Props) => {
  const classes = makeStyles(theme => ({
    root: {
      margin: 0
    }
  }))();

  return (
    <TextField
      classes={{ root: classes.root }}
      label={label}
      autoComplete="off"
      disabled={disabled}
      required={required}
      error={touched && invalid}
      helperText={(touched && error) || helperText}
      placeholder={placeholder}
      fullWidth
      size="small"
      margin="normal"
      variant="outlined"
      {...input}
      {...custom}
    />
  );
};

interface Props {
  label?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
}

export const CustomTextField = (props: BaseFieldProps & Props) => {
  return <Field {...props} component={renderTextField} />;
};

const renderFromHelper = ({
  touched,
  error
}: Pick<WrappedFieldMetaProps, "touched" | "error">) => {
  if (!(touched && error)) {
    return;
  } else {
    return <FormHelperText>{touched && error}</FormHelperText>;
  }
};

interface SelectProps {
  label: string;
  children: React.ReactNode;
}

export const RenderSelectField = ({
  input,
  label,
  meta: { touched, error },
  children,
  ...custom
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

  return (
    <FormControl
      classes={{ root: classes.root }}
      error={touched && error}
      variant="outlined"
      size="small"
    >
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId}>
        {label}
      </InputLabel>
      <Select
        labelWidth={labelWidth}
        labelId={labelId}
        {...input}
        {...custom}
        inputProps={{
          id: id
        }}
      >
        {children}
      </Select>
      {renderFromHelper({ touched, error })}
    </FormControl>
  );
};

interface AutoCompleteProps {
  children: React.ReactElement<{ children: string; value: string }>[];
}

export const RenderAutoComplete = ({
  input,
  // label,
  meta: { touched, error },
  children,
  ...custom
}: WrappedFieldProps & AutoCompleteProps) => {
  const options = children.map(item => ({
    text: item.props.children,
    value: item.props.value
  }));
  return (
    <Autocomplete
      options={options}
      getOptionLabel={option => option.text}
      renderInput={params => (
        <TextField
          {...params}
          label="Combo box"
          variant="outlined"
          fullWidth
          size="small"
        />
      )}
    />
  );
};
