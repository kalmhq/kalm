import React, { ChangeEvent } from "react";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";

export default class ComponentResources extends React.PureComponent {
  private formatCpuText = (value: number) => {
    return (value / 1000).toString() + "";
  };

  private setCpu = (event: React.ChangeEvent<{}>, value: number) => {
    console.log(value);
  };

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
            valueLabelDisplay="auto"
            step={100}
            marks
            min={100}
            max={2000}
            onChange={this.setCpu}
          />
        </Typography>
      </div>
    );
  }
}
