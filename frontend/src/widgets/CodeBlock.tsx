import { BoxProps, Theme, WithStyles } from "@material-ui/core";
import { createStyles, withStyles } from "@material-ui/styles";
import React from "react";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
      background: theme.palette.background.default,
    },
  });

interface Props extends WithStyles<typeof styles>, React.ComponentProps<any>, BoxProps {}

export const CodeBlock = withStyles(styles)(({ classes, children }: Props) => {
  return <pre className={classes.root}>{children}</pre>;
});
