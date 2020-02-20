import React, { HtmlHTMLAttributes } from "react";
import clsx from "clsx";
import TextField, { FilledTextFieldProps } from "@material-ui/core/TextField";
import {
  WrappedFieldProps,
  BaseFieldProps,
  WrappedFieldMetaProps
} from "redux-form";
import { Field } from "redux-form/immutable";
import { FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import FormHelperText from "@material-ui/core/FormHelperText";
import { ID } from "../../utils";
import { makeStyles } from "@material-ui/core/styles";

export const RenderTextField = ({
  label,
  input,
  placeholder,
  helperText,
  required,
  disabled,
  margin,
  meta: { touched, invalid, error },
  ...custom
}: FilledTextFieldProps & WrappedFieldProps & Props) => {
  const classes = makeStyles(theme => ({
    noMargin: {
      margin: 0
    }
  }))();

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
      onChange={(event: any) => input.onChange(event.target.value)}
      // onFocus={input.onChange}
      // onBlur={input.onChange}
      // value={input.value}
      defaultValue={input.value}
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
}

export const CustomTextField = (props: BaseFieldProps & Props) => {
  return <Field {...props} component={RenderTextField} />;
};

const renderFormHelper = ({
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

  const onChange = (
    event: React.ChangeEvent<{ name?: string; value: unknown }>,
    child: React.ReactNode
  ) => {
    input.onChange(event.target.value);
  };

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
        autoFocus={false}
        labelId={labelId}
        value={input.value}
        onChange={onChange}
        onBlur={input.onBlur}
        inputProps={{
          id: id
        }}
      >
        {children}
      </Select>
      {renderFormHelper({ touched, error })}
    </FormControl>
  );
};

const AutoCompleteTypeSelect = "select";
const AutoCompleteTypeFreeSolo = "freeSolo";

type AutoCompleteType =
  | typeof AutoCompleteTypeSelect
  | typeof AutoCompleteTypeFreeSolo;

interface AutoCompleteProps {
  label?: string;
  required?: boolean;
  type?: AutoCompleteType;
  children: React.ReactElement<{ children: string; value: string }>[];
}

export const RenderAutoCompleteSelect = ({
  input,
  label,
  type,
  children
}: WrappedFieldProps & AutoCompleteProps) => {
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
      onChange={(
        event: React.ChangeEvent<{}>,
        value: { text: string; value: string } | null
      ) => {
        if (value) {
          input.onChange(value.value);
        }
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          fullWidth
          size="small"
        />
      )}
    />
  );
};

export const RenderAutoComplete = ({
  input,
  label,
  children,
  meta: { touched, invalid, error }
}: WrappedFieldProps & AutoCompleteProps) => {
  children = React.Children.toArray(children);

  let options = children.map(item => ({
    text: item.props.children,
    value: item.props.value
  }));

  let selectedOption = options.find(x => x.value === input.value);

  // add this value as an option if there is no such option in list
  if (!selectedOption) {
    selectedOption = {
      text: input.value,
      value: input.value
    };
  }

  const helperText = "";

  const onInputChange = (event: React.ChangeEvent<{}>, value: string) => {
    if (!event) return;
    input.onChange(value);
  };

  const onChange = (
    _event: React.ChangeEvent<{}>,
    selectOption: { text: string; value: string } | null
  ) => {
    if (selectOption) {
      input.onChange(selectOption.value);
    }
  };

  return (
    <Autocomplete
      options={options}
      getOptionLabel={option => option.text}
      disableClearable
      // value={selectedOption}
      freeSolo
      autoComplete
      inputValue={input.value}
      onInputChange={onInputChange}
      onFocus={input.onFocus}
      onChange={onChange}
      renderInput={params => {
        return (
          <TextField
            {...params}
            error={touched && invalid}
            helperText={(touched && error) || helperText}
            label={label}
            variant="outlined"
            fullWidth
            size="small"
          />
        );
      }}
    />
  );
};
