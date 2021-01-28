import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import React from "react";
import { theme } from "theme/theme";

const styles = () =>
  createStyles({
    root: {
      // width: "100%",
      margin: `0 -${theme.spacing(2)}px`,
      padding: `0 ${theme.spacing(2)}px`,
      height: 26,
      lineHeight: 26,
      display: "flex",
      alignItems: "center",
    },
  });

const raw = (props: React.Props<any> & WithStyles<typeof styles>) => {
  return <div className={props.classes.root}>{props.children}</div>;
};

export const SectionTitle = withStyles(styles)(raw);
