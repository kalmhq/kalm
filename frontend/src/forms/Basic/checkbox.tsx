import { Box, Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel } from "@material-ui/core";
import { FieldProps, getIn } from "formik";
import React from "react";
import { KChip } from "widgets/Chip";
import produce from "immer";

interface KFormikBoolCheckboxRenderProps {
  label: React.ReactNode;
  title?: string;
  helperText?: string;
}

// For bool
export const KFormikBoolCheckboxRender = ({
  title,
  helperText,
  label,
  field: { name, value },
  form: { setFieldValue, errors, touched },
}: KFormikBoolCheckboxRenderProps & FieldProps) => {
  const checked: boolean = !!value;
  const error = getIn(errors, name);
  const showError = !!error && !!getIn(touched, name);

  return (
    <FormControl fullWidth error={showError} style={{ marginTop: 8 }}>
      {title ? <FormLabel component="legend">{title}</FormLabel> : null}
      <FormGroup row>
        <FormControlLabel
          control={<Checkbox checked={checked} onChange={(e) => setFieldValue(name, e.target.checked)} />}
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
  field: { name, value },
  form: { setFieldValue, errors },
}: KFormikCheckboxGroupRenderProps) => {
  const showError = !!getIn(errors, name);

  return (
    <FormControl fullWidth error={showError}>
      {title ? <FormLabel component="legend">{title}</FormLabel> : null}
      {showError ? <FormHelperText>{getIn(errors, name)}</FormHelperText> : null}
      <FormGroup row>
        {options.map((x) => {
          const onCheckChange = (_: any, checked: boolean) => {
            const newValue = produce(value, (draft: any[]) => {
              if (checked) {
                draft.push(x.value);
              } else {
                const index = value.indexOf(x.value);
                if (index > -1) {
                  draft.splice(index, 1);
                }
              }
            });

            setFieldValue(name, newValue);
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
