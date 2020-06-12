import React from "react";
import { IconButton, IconButtonProps, Tooltip } from "@material-ui/core";
import { Link } from "react-router-dom";

export const IconButtonWithTooltip = (
  props: IconButtonProps & {
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
  }
) => {
  const { tooltipTitle, tooltipPlacement, ...iconButtonProps } = props;

  const tooltipChild = <IconButton {...iconButtonProps}>{props.children}</IconButton>;

  if (props.disabled) {
    return tooltipChild;
  }

  return (
    <Tooltip title={tooltipTitle} placement={tooltipPlacement}>
      {tooltipChild}
    </Tooltip>
  );
};

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
  }
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
