import { createStyles, makeStyles, Theme } from "@material-ui/core";
import React from "react";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    success: {
      color: theme.palette.success.main,
    },
    warning: {
      color: theme.palette.warning.main,
    },
  }),
);

export const SuccessColorText: React.FC = ({ children }) => {
  const classes = useStyles();
  return <span className={classes.success}>{children}</span>;
};

export const WarningColorText: React.FC = ({ children }) => {
  const classes = useStyles();
  return <span className={classes.warning}>{children}</span>;
};
