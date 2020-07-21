import React, { Component } from "react";
import { withStyles, createStyles, WithStyles } from "@material-ui/core/styles";
import { LinearProgress, LinearProgressProps } from "@material-ui/core";
import { amber } from "@material-ui/core/colors";

const styles = () =>
  createStyles({
    colorPrimary: {
      backgroundColor: amber[200],
    },
    barColorPrimary: {
      backgroundColor: amber[800],
    },
  });

class ColoredLinearProgressRaw extends Component<LinearProgressProps & WithStyles<typeof styles>> {
  render() {
    const { classes, value, ...otherProps } = this.props;
    return (
      <LinearProgress
        value={value}
        {...otherProps}
        classes={
          value && value >= 95
            ? { colorPrimary: classes.colorPrimary, barColorPrimary: classes.barColorPrimary }
            : undefined
        }
      />
    );
  }
}

export const ColoredLinearProgress = withStyles(styles)(ColoredLinearProgressRaw);
