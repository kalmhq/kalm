import React from "react";
import { withStyles, createStyles, Button, Theme, ButtonProps, CircularProgress } from "@material-ui/core";

export const CustomizedButton = withStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      alignItems: "center"
    }
  })
)(
  (
    props: ButtonProps & {
      pending?: boolean;
    }
  ) => {
    const copiedProps = { ...props };
    delete copiedProps.pending;
    // console.log("pending", props.pending);
    return (
      <Button {...copiedProps} disabled={props.disabled || props.pending}>
        <CircularProgress
          style={{ marginRight: "6px", display: props.pending ? "inline" : "none" }}
          disableShrink={true}
          color="inherit"
          size={14}
        />
        {props.children}
      </Button>
    );
  }
);
