import React, { ChangeEvent } from "react";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import { CustomDisks } from "../Basic/disk";

const cpuMarks = [
  {
    value: 1000,
    label: "1 Core"
  },
  {
    value: 2000,
    label: "2 Core"
  },
  {
    value: 4000,
    label: "4 Core"
  },
  {
    value: 8000,
    label: "8 Core"
  },
  {
    value: 16000,
    label: "16 Core"
  }
];

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

export default class ComponentResources extends React.PureComponent {
  private formatCpuText = (value: number) => {
    return (value / 1000).toString() + "";
  };

  private formatMemoryText = (value: number) => {
    const realValue = this.memoryFromNormalizeToReal(value);
    if (realValue < 1000) {
      return realValue + "M";
    } else {
      return realValue / 1000 + "G";
    }
  };

  private setCpu = (event: ChangeEvent<{}>, value: number | number[]): void => {
    console.log(value);
  };

  private setMemory = (
    event: ChangeEvent<{}>,
    value: number | number[]
  ): void => {
    if (typeof value === "number") {
      console.log(this.memoryFromNormalizeToReal(value));
    }
  };

  private memoryFromNormalizeToReal = (value: number): number => {
    if (value <= 1000) {
      return value * 0.1;
    } else if (value <= 2000) {
      return value - 1000 + 100;
    } else {
      return (value - 2000) * 10 + 1100;
    }
  };

  // memory display rules
  // slider is from 0-2000
  // 1st 1000 unit is 0.1M
  // 2st 1000 uint is 1M
  // 3th 690 units is 10M

  public render() {
    return (
      <div>
        <Typography variant="h5" gutterBottom>
          CPU
          <Slider
            defaultValue={1000}
            // getAriaValueText={this.formatCpuText}
            valueLabelFormat={this.formatCpuText}
            aria-labelledby="discrete-slider"
            step={100}
            marks={cpuMarks}
            min={100}
            max={16000}
            valueLabelDisplay="on"
            onChange={this.setCpu}
          />
        </Typography>
        <Typography variant="h5" gutterBottom>
          Memory
          <Slider
            defaultValue={500}
            // getAriaValueText={this.formatCpuText}
            valueLabelFormat={this.formatMemoryText}
            aria-labelledby="discrete-slider"
            step={10}
            min={10}
            max={2690}
            valueLabelDisplay={"on"}
            marks={memoryMarks}
            onChange={this.setMemory}
          />
        </Typography>
        <Typography variant="h5" gutterBottom>
          Disk
          <CustomDisks />
        </Typography>
      </div>
    );
  }
}
