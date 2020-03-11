import React from "react";
import { FilledTextFieldProps } from "@material-ui/core/TextField";
import { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { Slider } from "@material-ui/core";

// memory display rules
// slider is from 0-2000
// 1st 1000 unit is 0.1M
// 2st 1000 uint is 1M
// 3th 690 units is 10M

const memoryMarks = [
  {
    value: 100,
    label: "10M"
  },
  {
    value: 505,
    label: "50M"
  },
  {
    value: 1000,
    label: "100M"
  },
  {
    value: 1400,
    label: "500M"
  },
  {
    value: 1900,
    label: "1G"
  },
  {
    value: 2090,
    label: "2G"
  },
  {
    value: 2290,
    label: "4G"
  },
  {
    value: 2690,
    label: "8G"
  }
];

const formatMemoryText = (value: number) => {
  const realValue = memoryFromNormalizeToReal(value) as number;
  if (realValue < 1000) {
    return realValue + "M";
  } else {
    return realValue / 1000 + "G";
  }
};

const memoryFromNormalizeToReal = (value: number): number => {
  if (value <= 1000) {
    return value * 0.1;
  } else if (value <= 2000) {
    return value - 1000 + 100;
  } else {
    return (value - 2000) * 10 + 1100;
  }
};

const memoryFromRealToNormalize = (value: number): number => {
  if (value <= 100) {
    return value * 10;
  } else if (value <= 1100) {
    return value - 100 + 1000;
  } else {
    return (value - 1100) / 10 + 2000;
  }
};

const renderMemorySlider = ({
  input
}: FilledTextFieldProps & WrappedFieldProps) => {
  return (
    <Slider
      defaultValue={memoryFromRealToNormalize(input.value)} // there will be a warning as the default value is changed. TODO
      aria-labelledby="discrete-slider"
      marks={memoryMarks}
      valueLabelDisplay="on"
      onChangeCommitted={(
        _event: React.ChangeEvent<{}>,
        value: number | number[]
      ) => {
        input.onChange((value: number | number[]) =>
          memoryFromNormalizeToReal(value as number)
        );
      }}
      // getAriaValueText={this.formatCpuText}
      valueLabelFormat={formatMemoryText}
      step={10}
      min={10}
      max={2690}
    />
  );
};

export const MemorySlider = () => {
  return <Field name="memory" component={renderMemorySlider} />;
};
