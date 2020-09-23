// value type is string
import { Slider, SliderProps, Typography } from "@material-ui/core";
import { ID } from "utils";
import React from "react";
import { FieldRenderProps } from "react-final-form";

export const FinialSliderRender = ({
  label,
  min,
  max,
  step,
  input: { onChange, value },
}: SliderProps & FieldRenderProps<number>) => {
  const id = ID();
  return (
    <div>
      {label ? (
        <Typography id={id} gutterBottom>
          {label}
        </Typography>
      ) : null}
      <Slider
        value={value || 0}
        onChangeCommitted={(_event: React.ChangeEvent<{}>, value: number | number[]) => onChange(value)}
        aria-labelledby={id}
        valueLabelDisplay="auto"
        step={step}
        marks
        min={min}
        max={max}
      />
    </div>
  );
};
