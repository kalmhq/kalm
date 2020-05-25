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
  const { tooltipTitle, tooltipPlacement } = props;

  const copiedProps = { ...props };
  delete copiedProps.tooltipTitle;
  delete copiedProps.tooltipPlacement;

  return (
    <Tooltip title={tooltipTitle} placement={tooltipPlacement}>
      <IconButton {...copiedProps}>{props.children}</IconButton>
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
  const { tooltipTitle, tooltipPlacement, to } = props;

  const copiedProps = { ...props };
  delete copiedProps.tooltipTitle;
  delete copiedProps.tooltipPlacement;

  return (
    <Tooltip title={tooltipTitle} placement={tooltipPlacement}>
      <Link to={to} style={{ color: "inherit" }}>
        <IconButton {...copiedProps}>{props.children}</IconButton>
      </Link>
    </Tooltip>
  );
};
