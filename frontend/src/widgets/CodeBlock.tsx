import { BoxProps, Theme } from "@material-ui/core";
import React from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";

const styles = makeStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
    background: theme.palette.background.default,
  },
}));

interface Props extends React.ComponentProps<any>, BoxProps {}

export const CodeBlock = ({ children }: Props) => {
  const classes = styles();

  return <pre className={classes.root}>{children}</pre>;
};
