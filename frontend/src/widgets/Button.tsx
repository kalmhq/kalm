import React from "react";
import { withStyles, createStyles, Button, Theme, ButtonProps, CircularProgress } from "@material-ui/core";

export const CustomizedButton = withStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      alignItems: "center"
    },
    progress: {
      marginRight: theme.spacing(1)
    }
  })
)(
  (
    props: ButtonProps & {
      pending?: boolean;
    }
  ) => {
    return (
      <Button {...props} disabled={props.disabled || props.pending}>
        {props.pending ? <CircularProgress style={{ marginRight: "6px" }} color="inherit" size={14} /> : null}
        {props.children}
      </Button>
    );
  }
);
