import React from "react";
import { withStyles, createStyles, Theme, WithStyles } from "@material-ui/core";

const styles = createStyles({
  dot: {
    borderRadius: "4px",
    height: "8px",
    width: "8px",
    backgroundColor: "#8BC34A",
    display: "inline-block",
    margin: "0 8px 0 0"
  },
  green: {
    backgroundColor: "#8BC34A"
  },
  yellow: {
    backgroundColor: "#F3E563"
  },
  red: {
    backgroundColor: "#C34A4A"
  }
});

interface Props {
  color: "green" | "yellow" | "red";
}

export const Dot = withStyles((theme: Theme) => styles)((props: WithStyles<typeof styles> & Props) => {
  const { classes } = props;

  let colorClass = classes.green;
  if (props.color === "yellow") {
    colorClass = "yellow";
  } else if (props.color === "red") {
    colorClass = "red";
  }

  return <div className={`${classes.dot} ${colorClass}`}></div>;
});
