import React from "react";
import { IconButton, IconButtonProps, Tooltip, withStyles, WithStyles, Theme } from "@material-ui/core";
import { Link } from "react-router-dom";

const styles = (theme: Theme) => ({
  button: {
    color: theme.palette.grey[600],
    "&:disabled": {
      cursor: "not-allowed !important",
      background: theme.palette.grey[100],
    },
    "&:hover": {
      background: theme.palette.primary.light,
      color: theme.palette.primary.main,
    },
  },
});

export const IconButtonWithTooltip = withStyles(styles)(
  (
    props: IconButtonProps &
      WithStyles<typeof styles> & {
        tooltipTitle: string;
        component?: any;
        to?: any;
        href?: any;
        tooltipPlacement?:
          | "bottom-end"
          | "bottom-start"
          | "bottom"
          | "left-end"
          | "left-start"
          | "left"
          | "right-end"
          | "right-start"
          | "right"
          | "top-end"
          | "top-start"
          | "top";
      },
  ) => {
    const { tooltipTitle, tooltipPlacement, classes, ...iconButtonProps } = props;

    const tooltipChild = (
      <IconButton className={classes.button} {...iconButtonProps}>
        {props.children}
      </IconButton>
    );

    if (props.disabled) {
      return (
        <Tooltip title={tooltipTitle} placement={tooltipPlacement}>
          <div>{tooltipChild}</div>
        </Tooltip>
      );
    }

    return (
      <Tooltip title={tooltipTitle} placement={tooltipPlacement}>
        {tooltipChild}
      </Tooltip>
    );
  },
);

export const IconLinkWithToolTip = (
  props: IconButtonProps & {
    tooltipTitle: string;
    to: string;
    tooltipPlacement?:
      | "bottom-end"
      | "bottom-start"
      | "bottom"
      | "left-end"
      | "left-start"
      | "left"
      | "right-end"
      | "right-start"
      | "right"
      | "top-end"
      | "top-start"
      | "top";
  },
) => {
  const { tooltipTitle, tooltipPlacement, to, ...iconButtonProps } = props;

  const tooltipChild = (
    <Link to={to} style={{ color: "inherit" }}>
      <IconButton {...iconButtonProps}>{props.children}</IconButton>
    </Link>
  );

  if (props.disabled) {
    return tooltipChild;
  }

  return (
    <Tooltip title={tooltipTitle} placement={tooltipPlacement}>
      {tooltipChild}
    </Tooltip>
  );
};
