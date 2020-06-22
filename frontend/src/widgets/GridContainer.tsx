import React from "react";
import { createStyles, withStyles, WithStyles } from "@material-ui/styles";

const styles = () =>
  createStyles({
    root: {
      overflow: "hidden",
    },
  });

const raw = (props: React.Props<any> & WithStyles<typeof styles>) => {
  return <div className={props.classes.root}>{props.children}</div>;
};

export const GridContainer = withStyles(styles)(raw);
