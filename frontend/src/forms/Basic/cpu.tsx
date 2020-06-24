import React from "react";
import { FilledTextFieldProps } from "@material-ui/core/TextField";
import { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { Slider } from "@material-ui/core";

const formatCpuText = (value: number) => {
  return (value / 1000).toString() + "";
};

const cpuMarks = [
  {
    value: 1000,
    label: "1 Core",
  },
  {
    value: 2000,
    label: "2 Core",
  },
  {
    value: 4000,
    label: "4 Core",
  },
  {
    value: 8000,
    label: "8 Core",
  },
  {
    value: 16000,
    label: "16 Core",
  },
];

const renderCpuSlider = ({ input }: FilledTextFieldProps & WrappedFieldProps) => {
  return (
    <Slider
      defaultValue={input.value} // there will be a warning as the default value is changed. TODO
      valueLabelFormat={formatCpuText}
      aria-labelledby="discrete-slider"
      step={100}
      marks={cpuMarks}
      min={100}
      max={16000}
      valueLabelDisplay="on"
      onChangeCommitted={(_event: React.ChangeEvent<{}>, value: number | number[]) => {
        input.onChange(value);
      }}
    />
  );
};

export const CPUSlider = () => {
  return <Field name="cpu" component={renderCpuSlider} />;
};
