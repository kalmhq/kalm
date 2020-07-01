import React from "react";
import { Chip, ChipProps } from "@material-ui/core";

interface KChipProps {
  // disabled style but clickable
  disabledStyle?: boolean;
  // for color like green
  htmlColor?: string;
}

export const KChip = (props: ChipProps & KChipProps) => {
  const { disabledStyle, htmlColor, color, size, ...otherProps } = props;

  const style: any = { borderRadius: 2 };

  if (disabledStyle) {
    style.opacity = 0.5;
  }

  if (htmlColor) {
    style.backgroundColor = htmlColor;
  }

  return <Chip style={style} color={color || "primary"} size={size || "small"} {...otherProps} />;
};
