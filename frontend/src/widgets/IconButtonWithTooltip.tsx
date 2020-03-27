import React from "react";
import { IconButton, IconButtonProps, Tooltip } from "@material-ui/core";

export const IconButtonWithTooltip = (
  props: IconButtonProps & {
    tooltipTitle: string;
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
