import React from "react";
import { IconButton, IconButtonProps, Tooltip } from "@material-ui/core";

export const IconButtonWithTooltip = (
  props: IconButtonProps & {
    tooltipTitle: string;
  }
) => {
  const { tooltipTitle } = props;

  const copiedProps = { ...props };
  delete copiedProps.tooltipTitle;

  return (
    <Tooltip title={tooltipTitle}>
      <IconButton {...copiedProps}>{props.children}</IconButton>
    </Tooltip>
  );
};
