import React, { ChangeEvent } from "react";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import { CustomDisks } from "../Basic/disk";
import { createStyles, withStyles, WithStyles, Theme } from "@material-ui/core";
import { CPUSlider } from "../Basic/cpu";
import { MemorySlider } from "../Basic/memory";

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
