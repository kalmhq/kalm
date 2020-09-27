import React from "react";
import { Link, LinkProps } from "react-router-dom";
import { Link as MLink, LinkProps as MLinkProps, useTheme } from "@material-ui/core";
import { BlankTargetLink } from "widgets/BlankTargetLink";

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

export const DNS01ChallengeLink = () => {
  return (
    <BlankTargetLink href={"https://letsencrypt.org/docs/challenge-types/#dns-01-challenge"}>
      DNS-01 challenge
    </BlankTargetLink>
  );
};
