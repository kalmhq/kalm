import React, { ChangeEvent } from "react";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import { CustomDisks } from "../Basic/disk";
import { createStyles, withStyles, WithStyles, Theme } from "@material-ui/core";
import { CPUSlider } from "../Basic/cpu";
import { MemorySlider } from "../Basic/memory";

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

const styles = (_: Theme) =>
  createStyles({
    header: {
      marginBottom: 50
    },
    diskHeader: {
      marginTop: 20,
      marginBottom: 20
    }
  });

interface ComponentResourcesProps extends WithStyles<typeof styles> {}

export default withStyles(styles)(
  class ComponentResources extends React.PureComponent<
    ComponentResourcesProps
  > {
    public render() {
      return (
        <div>
          <Typography
            variant="h5"
            gutterBottom
            classes={{ root: this.props.classes.header }}
          >
            CPU
          </Typography>
          {/* <Slider
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
          /> */}

          <CPUSlider />
          <Typography
            variant="h5"
            gutterBottom
            classes={{ root: this.props.classes.header }}
          >
            Memory
          </Typography>
          <MemorySlider />
          <Typography
            variant="h5"
            gutterBottom
            classes={{ root: this.props.classes.diskHeader }}
          >
            Disk
          </Typography>
          <CustomDisks />
        </div>
      );
    }
  }
);
