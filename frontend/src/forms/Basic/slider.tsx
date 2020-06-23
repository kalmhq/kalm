import { Slider, SliderProps, Typography } from "@material-ui/core";
import React from "react";
import { WrappedFieldProps } from "redux-form";
import { ID } from "utils";

interface Props {
  label?: string;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
}

// value type is string
export const KRenderSlider = ({
  input,
  label,
  min,
  max,
  step,
  disabled,
  meta: { touched, invalid, error },
}: SliderProps & WrappedFieldProps & Props) => {
  const id = ID();

  return (
    <div>
      {label ? (
        <Typography id={id} gutterBottom>
          {label}
        </Typography>
      ) : null}
      <Slider
        value={input.value}
        onChangeCommitted={(_event: React.ChangeEvent<{}>, value: number | number[]) => input.onChange(value)}
        aria-labelledby={id}
        valueLabelDisplay="auto"
        step={step}
        marks
        min={min}
        max={max}
        disabled={disabled}
      />
    </div>
  );
};
