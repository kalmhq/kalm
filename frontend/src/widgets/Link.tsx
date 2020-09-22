import React from "react";
import { Link, LinkProps } from "react-router-dom";
import { Link as MLink, LinkProps as MLinkProps, useTheme } from "@material-ui/core";

export function KLink(props: LinkProps) {
  const theme = useTheme();
  return (
    <Link
      {...props}
      style={{ color: theme.palette.type === "light" ? theme.palette.primary.dark : theme.palette.primary.light }}
    />
  );
}

export function KMLink(props: MLinkProps | { component: any }) {
  const theme = useTheme();

  return (
    <MLink
      {...props}
      style={{ color: theme.palette.type === "light" ? theme.palette.primary.dark : theme.palette.primary.light }}
    />
  );
}
