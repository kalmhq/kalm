import React from "react";
import clsx from "clsx";
import { Theme, WithStyles, withStyles } from "@material-ui/core";
import { createStyles } from "@material-ui/core/styles";
// https://create-react-app.dev/docs/adding-images-fonts-and-files/#adding-svgs
import { ReactComponent as SvgChart } from "images/ports-guidance.svg";

// svg original editable file is saved at
// https://github.com/davidqhr/diagrams-storage/blob/master/kalm-ports-guidance.drawio

const style = (theme: Theme) =>
  createStyles({
    root: {
      backgroundColor: "transparent !important",
    },
    highlightServicePort: {
      "& > g > rect:nth-child(7)": {
        animation: "$stroke-width-change 1s infinite",
      },
    },
    highlightContainerPort: {
      "& > g > rect:nth-child(11)": {
        animation: "$stroke-width-change 1s infinite",
      },
    },
    "@keyframes stroke-width-change": {
      "0%": {
        strokeWidth: 1,
      },
      "50%": {
        strokeWidth: 4,
      },
      "100%": {
        strokeWidth: 1,
      },
    },
  });

interface Props extends WithStyles<typeof style> {
  highlightServicePort?: boolean;
  highlightContainerPort?: boolean;
}

const PortChartRaw = (props: Props) => {
  const { classes, highlightContainerPort, highlightServicePort } = props;
  return (
    <SvgChart
      className={clsx(classes.root, {
        [classes.highlightServicePort]: highlightServicePort,
        [classes.highlightContainerPort]: highlightContainerPort,
      })}
    />
  );
};

export const PortChart = withStyles(style)(PortChartRaw);
