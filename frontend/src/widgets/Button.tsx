import React from "react";
import {
  withStyles,
  createStyles,
  Button,
  Theme,
  ButtonProps,
  CircularProgress,
  WithStyles,
  Box
} from "@material-ui/core";
import { primaryColor } from "../theme";

const customizedButtonStyle = (theme: Theme) => {
  return createStyles({
    root: {
      display: "flex",
      alignItems: "center"
    },
    text: {
      color: theme.palette.text.primary
    },
    textPrimary: {
      color: theme.palette.primary.main
    },
    contained: {
      background: "#fff",
      color: theme.palette.primary.main,
      "&:disabled": {
        background: "transparent"
      },
      "&:hover": {
        background: "#fff"
      }
    },
    containedPrimary: {
      background: theme.palette.primary.main,
      color: "#fff",
      "&:disabled": {
        background: "transparent"
      },
      "&:hover": {
        background: theme.palette.primary.main
      }
    }
  });
};

export const ButtonWhite = (props: ButtonProps) => {
  return (
    <Box boxShadow={3} m={0} p={0} style={{ width: "fit-content", borderRadius: 5 }}>
      <Button size="small" style={{ paddingLeft: 20, paddingRight: 20 }} color="primary" {...props}>
        {props.children}
      </Button>
    </Box>
  );
};

export const ButtonGrey = (props: ButtonProps) => {
  return (
    <Button
      variant="contained"
      size="small"
      style={{ paddingLeft: 20, paddingRight: 20, color: primaryColor }}
      {...props}>
      {props.children}
    </Button>
  );
};

type CustomizedButtonProps = ButtonProps &
  WithStyles<typeof customizedButtonStyle> & {
    pending?: boolean;
  };

type RaisedButtonProps = ButtonProps & {
  pending?: boolean;
};

export const CustomizedButton = withStyles(customizedButtonStyle)((props: CustomizedButtonProps) => {
  const copiedProps = { ...props };
  delete copiedProps.pending;
  // console.log("pending", props.pending);
  return (
    <Button disabled={props.disabled || props.pending} {...copiedProps}>
      <CircularProgress
        style={{ marginRight: "6px", display: props.pending ? "inline" : "none" }}
        disableShrink={true}
        color="inherit"
        size={14}
      />
      {props.children}
    </Button>
  );
});

export const RaisedButton = (props: RaisedButtonProps) => {
  return (
    <CustomizedButton variant="contained" {...props}>
      {props.children}
    </CustomizedButton>
  );
};
