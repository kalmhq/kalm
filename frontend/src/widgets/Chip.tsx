import React from "react";
import { Chip, ChipProps } from "@material-ui/core";

export const KChip = (props: ChipProps) => {
  const { color, size, ...otherProps } = props;

  return <Chip style={{ borderRadius: 2 }} color={color || "primary"} size={size || "small"} {...otherProps} />;
};
