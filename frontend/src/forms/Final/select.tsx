import { FormControl, InputLabel, makeStyles, MenuItem, Select, SelectProps } from "@material-ui/core";
import FormHelperText from "@material-ui/core/FormHelperText";
import React from "react";
import { FieldRenderProps } from "react-final-form";
import { ID } from "utils";

type FinalSelectFieldProps = FieldRenderProps<string> &
  SelectProps & {
    options: {
      text: React.ReactNode;
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
                {option.text}
              </MenuItem>
            );
          })}
      </Select>

      {renderFormHelper({ touched, error })}
    </FormControl>
  );
};
