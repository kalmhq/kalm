import { Box, Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel } from "@material-ui/core";
import React from "react";
import { KChip } from "widgets/Chip";
import { FieldRenderProps } from "react-final-form";
import { FieldArrayRenderProps } from "react-final-form-arrays";

interface FinalBoolCheckboxRenderProps {
  label: React.ReactNode;
  title?: string;
  helperText?: string;
}

export const FinalBoolCheckboxRender = ({
  title,
  helperText,
  label,
  input: { onChange, checked },
  meta: { error, touched },
}: FinalBoolCheckboxRenderProps & FieldRenderProps<string>) => {
  const showError = !!error && touched;

  return (
    <FormControl fullWidth error={showError} style={{ marginTop: 8 }}>
      {title ? <FormLabel component="legend">{title}</FormLabel> : null}
      <FormGroup row>
        <FormControlLabel control={<Checkbox checked={checked} onChange={onChange} />} label={label} />
      </FormGroup>
      {showError ? (
        <FormHelperText>{error}</FormHelperText>
      ) : helperText ? (
        <FormHelperText>{helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
};

interface FinalCheckboxGroupRenderOption {
  value: string;
  label: string;
  htmlColor?: string;
}

interface FinalCheckboxGroupRenderProps {
  title?: string;
  helperText?: string;
  options: FinalCheckboxGroupRenderOption[];
  componentType?: "Checkbox" | "Chip";
}

// For value type is string[]
export const FinalCheckboxGroupRender = (props: FinalCheckboxGroupRenderProps & FieldArrayRenderProps<string, any>) => {
  const {
    title,
    meta: { error },
    fields: { value, push, remove },
    componentType,
    helperText,
    options,
  } = props;

  return (
    <FormControl fullWidth error={!!error}>
      {title ? <FormLabel component="legend">{title}</FormLabel> : null}
      {error ? <FormHelperText>{error}</FormHelperText> : null}
      <FormGroup row>
        {options.map((x) => {
          const onCheckChange = (_: any, checked: boolean) => {
            if (checked) {
              push(x.value);
            } else {
              const index = value.indexOf(x.value);
              remove(index);
            }
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
