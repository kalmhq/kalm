import { Box, Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel } from "@material-ui/core";
import { FieldProps, getIn } from "formik";
import { Checkbox as FormikCheckbox } from "formik-material-ui";
import React from "react";
import { KChip } from "widgets/Chip";

interface KFormikBoolCheckboxRenderProps {
  value: any;
  label: React.ReactNode;
  title?: string;
  helperText?: string;
  onChange: any;
  error: any;
  touched: boolean;
}

// For bool
export const KFormikBoolCheckboxRender = ({
  value,
  onChange,
  error,
  touched,
  title,
  helperText,
  label,
}: KFormikBoolCheckboxRenderProps) => {
  const checked: boolean = !!value;
  const showError = !!error && touched;

  return (
    <FormControl fullWidth error={showError} style={{ marginTop: 8 }}>
      {title ? <FormLabel component="legend">{title}</FormLabel> : null}
      <FormGroup row>
        <FormControlLabel
          control={<Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} />}
          label={label}
        />
      </FormGroup>
      {showError ? (
        <FormHelperText>{error}</FormHelperText>
      ) : helperText ? (
        <FormHelperText>{helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
};

export const KFormikCheckbox = (props: KFormikBoolCheckboxRenderProps & FieldProps) => {
  const { error, touched, title, helperText, label } = props;
  const showError = !!error && touched;

  return (
    <FormControl fullWidth error={showError} style={{ marginTop: 8 }}>
      {title ? <FormLabel component="legend">{title}</FormLabel> : null}
      <FormGroup row>
        <FormControlLabel control={<FormikCheckbox type="checkbox" {...props} />} label={label} />
      </FormGroup>
      {showError ? (
        <FormHelperText>{error}</FormHelperText>
      ) : helperText ? (
        <FormHelperText>{helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
};

interface KFormikCheckboxGroupRenderOption {
  value: string;
  label: string;
  htmlColor?: string;
}

interface KFormikCheckboxGroupRenderProps extends FieldProps {
  title?: string;
  helperText?: string;
  options: KFormikCheckboxGroupRenderOption[];
  componentType?: "Checkbox" | "Chip";
}

// For value type is string[]
export const KFormikCheckboxGroupRender = ({
  title,
  options,
  helperText,
  componentType,
  field: { name },
  form: { setFieldValue, values, errors },
}: KFormikCheckboxGroupRenderProps) => {
  const showError = !!getIn(errors, name);

  let value = getIn(values, name);
  return (
    <FormControl fullWidth error={showError}>
      {title ? <FormLabel component="legend">{title}</FormLabel> : null}
      {showError ? <FormHelperText>{getIn(errors, name)}</FormHelperText> : null}
      <FormGroup row>
        {options.map((x) => {
          const onCheckChange = (_: any, checked: boolean) => {
            if (checked) {
              value.push(x.value);
            } else {
              const index = value.indexOf(x.value);
              if (index > -1) {
                value.splice(index, 1);
              }
            }
            // copy array
            setFieldValue(name, [...value]);
          };

          if (componentType === "Chip") {
            return (
              <Box mt={1} mr={1} mb={1} key={x.value}>
                <KChip
                  clickable
                  disabledStyle={value.indexOf(x.value) === -1}
                  htmlColor={x.htmlColor}
                  label={x.value}
                  onClick={() => {
                    onCheckChange(null, value.indexOf(x.value) === -1);
                  }}
                />
              </Box>
            );
          }
          return (
            <FormControlLabel
              key={x.value}
              control={
                <Checkbox checked={value && value.indexOf(x.value) > -1} onChange={onCheckChange} name={x.value} />
              }
              label={x.label}
            />
          );
        })}
      </FormGroup>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
};

interface KCheckboxGroupRenderOption {
  value: string;
  label: string;
  htmlColor?: string;
}
