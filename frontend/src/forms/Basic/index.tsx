import { FormControl, InputLabel, Select } from "@material-ui/core";
import FormHelperText from "@material-ui/core/FormHelperText";
import { makeStyles } from "@material-ui/core/styles";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import { Autocomplete } from "@material-ui/lab";
import clsx from "clsx";
import React from "react";
import { BaseFieldProps, WrappedFieldMetaProps, WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { ID } from "../../utils";

export const RenderTextField = ({
  label,
  input,
  placeholder,
  helperText,
  required,
  disabled,
  margin,
  formValueToEditValue,
  editValueToFormValue,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & Props) => {
  const classes = makeStyles(theme => ({
    noMargin: {
      margin: 0
    }
  }))();

  // useEffect(() => {
  //   if (editValueToFormValue) {
  //     input.onChange(editValueToFormValue(input.value));
  //   }
  //   // eslint-disable-next-line
  // }, []);

  return (
    <TextField
      classes={{ root: clsx({ [classes.noMargin]: !margin }) }}
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
      // {...input}
      // onChange={input.onChange}
      onChange={(event: any) => {
        editValueToFormValue
          ? input.onChange(editValueToFormValue(event.target.value))
          : input.onChange(event.target.value);
      }}
      // onFocus={input.onChange}
      // onBlur={(event: any) => {
      //   editValueToFormValue
      //     ? input.onBlur(editValueToFormValue(event.target.value))
      //     : input.onBlur(event.target.value);
      // }}
      // value={input.value}
      defaultValue={formValueToEditValue ? formValueToEditValue(input.value) : input.value}
      {...custom}
    />
  );
};

interface Props {
  label?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  margin?: boolean;
  multiline?: boolean;
  rows?: number;
  rowsMax?: number;
  disabled?: boolean;
  formValueToEditValue?: (value: any) => string;
  editValueToFormValue?: (value: string) => any;
}

export const CustomTextField = (props: BaseFieldProps & Props) => {
  return <Field {...props} component={RenderTextField} />;
};

const renderFormHelper = ({ touched, error }: Pick<WrappedFieldMetaProps, "touched" | "error">) => {
  if (!(touched && error)) {
    return;
  } else {
    return <FormHelperText>{touched && error}</FormHelperText>;
  }
};

interface SelectProps {
  label: string;
  value?: string;
  children: React.ReactNode;
}

export const RenderSelectField = ({
  input,
  label,
  value,
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
      error={touched === true && error != null}
      variant="outlined"
      size="small"
      margin="dense">
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId}>
        {label}
      </InputLabel>
      <Select
        label={label}
        labelWidth={labelWidth}
        autoFocus={false}
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

interface AutoCompleteFreeSoloProps {
  label?: string;
  options: string[];
}

export const RenderAutoCompleteFreeSolo = (props: WrappedFieldProps & AutoCompleteFreeSoloProps) => {
  const {
    options,
    input,
    label,
    // helperText,
    meta: { touched, invalid, error }
  } = props;
  return (
    <Autocomplete
      freeSolo
      disableClearable
      options={options.map(option => option)}
      defaultValue={input.value || ""}
      onChange={(event: React.ChangeEvent<{}>, value: string | null) => {
        if (value) {
          input.onChange(value);
        }
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          margin="normal"
          variant="outlined"
          fullWidth
          size="small"
          error={touched && invalid}
          helperText={touched && error}
          // defaultValue={input.value || ""}
          onChange={(event: any) => {
            input.onChange(event.target.value);
          }}
        />
      )}
    />
  );
};

interface AutoCompleteSelectProps {
  label?: string;
  required?: boolean;
  children: React.ReactElement<{ children: string; value: string }>[];
}

export const RenderAutoCompleteSelect = ({ input, label, children }: WrappedFieldProps & AutoCompleteSelectProps) => {
  children = React.Children.toArray(children);

  const options = children.map(item => ({
    text: item.props.children,
    value: item.props.value
  }));

  let selectedOption = options.find(x => x.value === input.value);

  if (!selectedOption) {
    selectedOption = options[0];
  }

  // TODO, if there is no options, we should disabled the add existing disk

  return (
    <Autocomplete
      options={options}
      getOptionLabel={option => option.text}
      value={selectedOption}
      disableClearable
      onChange={(event: React.ChangeEvent<{}>, value: { text: string; value: string } | null) => {
        if (value) {
          input.onChange(value.value);
        }
      }}
      renderInput={params => <TextField {...params} label={label} variant="outlined" fullWidth size="small" />}
    />
  );
};
